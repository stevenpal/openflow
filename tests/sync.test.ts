import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { applyStreamSync, readLocalFileSource } from "../src/sync.js";
import { shouldRecomputeDerived } from "../src/derived.js";
import { listSnapshots } from "../src/streams/storage.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeTempWorkspace();
});
afterEach(() => cleanupWorkspace(root));

describe("applyStreamSync (per-stream sync outcome)", () => {
  it("produces a structured finding with diff highlights when content changed", () => {
    applyStreamSync(root, "s1", "md", { ok: true, normalizedContent: "line a\nline b" });
    const finding = applyStreamSync(root, "s1", "md", { ok: true, normalizedContent: "line a\nline c" });

    expect(finding).toMatchObject({ id: "s1", changed: true });
    expect(finding.addedLines).toEqual(["line c"]);
    expect(finding.removedLines).toEqual(["line b"]);
  });

  it("reports unchanged with no diff highlights on an identical resync", () => {
    applyStreamSync(root, "s1", "md", { ok: true, normalizedContent: "same" });
    const finding = applyStreamSync(root, "s1", "md", { ok: true, normalizedContent: "same" });
    expect(finding.changed).toBe(false);
    expect(finding.addedLines).toEqual([]);
  });

  it("a simulated MCP 401 reports the specific failure and leaves the last good snapshot untouched", () => {
    applyStreamSync(root, "s1", "md", { ok: true, normalizedContent: "good snapshot" });
    const finding = applyStreamSync(root, "s1", "md", { ok: false, failure: "MCP server returned 401 Unauthorized" });

    expect(finding).toEqual({ id: "s1", changed: false, failure: "MCP server returned 401 Unauthorized" });
    expect(listSnapshots(root, "s1", "normalized")).toHaveLength(1);
  });

  it("one stream's failure does not block finding results for other streams", () => {
    applyStreamSync(root, "ok-stream", "md", { ok: true, normalizedContent: "v1" });
    const findings = [
      applyStreamSync(root, "ok-stream", "md", { ok: true, normalizedContent: "v2" }),
      applyStreamSync(root, "broken-stream", "md", { ok: false, failure: "unreachable" }),
    ];
    expect(findings[0].changed).toBe(true);
    expect(findings[1].failure).toBe("unreachable");
  });
});

describe("readLocalFileSource (moved-file failure detection)", () => {
  it("reports the moved-file cause when the recorded path no longer resolves", () => {
    const result = readLocalFileSource(path.join(root, "does-not-exist.txt"));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("not found");
  });

  it("reads the file successfully when the path still resolves", () => {
    const filePath = path.join(root, "notes.txt");
    fs.writeFileSync(filePath, "hello");
    const result = readLocalFileSource(filePath);
    expect(result).toEqual({ ok: true, content: "hello" });
  });
});

describe("two-sync scenario: derived stream recomputes only when its source changed", () => {
  it("sync 1 (no source change) leaves the derived stream untouched; sync 2 (source changes) recomputes it", () => {
    // Sync 1: source stream synced with no change from its initial snapshot.
    applyStreamSync(root, "source-1", "md", { ok: true, normalizedContent: "initial content" });
    const sync1Finding = applyStreamSync(root, "source-1", "md", { ok: true, normalizedContent: "initial content" });
    const sync1Changed = new Set(sync1Finding.changed ? ["source-1"] : []);

    const derivedEntry = {
      id: "derived-1",
      origin: "derived" as const,
      syncable: true,
      source_stream_ids: ["source-1"],
      descriptor: "combine source-1",
      type: "plain-text" as const,
      description: "d",
      intents: [],
      added_at: "2026-01-01T00:00:00Z",
      last_synced_at: null,
    };

    expect(shouldRecomputeDerived(derivedEntry, sync1Changed)).toBe(false);
    expect(listSnapshots(root, "derived-1", "normalized")).toHaveLength(0);

    // Sync 2: source stream's content actually changes.
    const sync2Finding = applyStreamSync(root, "source-1", "md", { ok: true, normalizedContent: "updated content" });
    const sync2Changed = new Set(sync2Finding.changed ? ["source-1"] : []);

    expect(shouldRecomputeDerived(derivedEntry, sync2Changed)).toBe(true);
    // Recompute and store the derived stream's own new normalized snapshot, as /flow:sync would.
    applyStreamSync(root, "derived-1", "txt", { ok: true, normalizedContent: "combined: updated content" });
    expect(listSnapshots(root, "derived-1", "normalized")).toHaveLength(1);
  });
});
