import { describe, it, expect, afterEach, beforeEach } from "vitest";
import fs from "node:fs";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { initWorkspace } from "../src/commands/init.js";
import { workspacePaths } from "../src/workspace.js";
import { addStream, removeStream, updateStream, getStreams, LedgerValidationError } from "../src/ledger/store.js";
import { listLedgerSnapshots } from "../src/ledger/snapshot.js";
import type { NewStreamEntry } from "../src/ledger/store.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeTempWorkspace();
  initWorkspace(root);
});
afterEach(() => cleanupWorkspace(root));

function sourceEntry(id: string, overrides: Partial<NewStreamEntry> = {}): NewStreamEntry {
  return {
    id,
    descriptor: `fetch ${id}`,
    type: "plain-text",
    origin: "source",
    syncable: true,
    description: `Source stream ${id}`,
    added_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("add_stream / remove_stream / update_stream", () => {
  it("accepts a valid source stream and rejects a duplicate id", () => {
    addStream(root, sourceEntry("s1"));
    expect(() => addStream(root, sourceEntry("s1"))).toThrow(LedgerValidationError);
  });

  it("rejects a derived stream whose source_stream_ids references a nonexistent stream", () => {
    expect(() =>
      addStream(
        root,
        sourceEntry("d1", { origin: "derived", type: "plain-text", source_stream_ids: ["missing"] }),
      ),
    ).toThrow(LedgerValidationError);
  });

  it("enforces the one-level-deep constraint (derived can't reference derived)", () => {
    addStream(root, sourceEntry("s1"));
    addStream(root, sourceEntry("d1", { origin: "derived", source_stream_ids: ["s1"] }));
    expect(() =>
      addStream(root, sourceEntry("d2", { origin: "derived", source_stream_ids: ["d1"] })),
    ).toThrow(LedgerValidationError);
  });

  it("accepts a valid derived stream referencing an existing source stream", () => {
    addStream(root, sourceEntry("s1"));
    const entry = addStream(root, sourceEntry("d1", { origin: "derived", source_stream_ids: ["s1"] }));
    expect(entry.origin).toBe("derived");
    expect(entry.source_stream_ids).toEqual(["s1"]);
  });

  it("rejects removal that would leave a derived stream dangling, accepts a clean removal", () => {
    addStream(root, sourceEntry("s1"));
    addStream(root, sourceEntry("d1", { origin: "derived", source_stream_ids: ["s1"] }));
    expect(() => removeStream(root, "s1")).toThrow(LedgerValidationError);

    removeStream(root, "d1");
    removeStream(root, "s1");
    expect(getStreams(root).entries).toEqual([]);
  });

  it("update_stream rejects an invalid mutation and accepts a valid one", () => {
    addStream(root, sourceEntry("s1"));
    expect(() => updateStream(root, "s1", { type: "not-a-shape" as never })).toThrow(LedgerValidationError);

    const updated = updateStream(root, "s1", { syncable: false });
    expect(updated.syncable).toBe(false);
  });

  it("snapshots the ledger before every mutation", () => {
    addStream(root, sourceEntry("s1"));
    const beforeSecondMutation = fs.readFileSync(workspacePaths(root).ledgerFile, "utf8");

    addStream(root, sourceEntry("s2"));

    const snapshots = listLedgerSnapshots(root);
    expect(snapshots.length).toBeGreaterThan(0);
    const latestSnapshotContent = fs.readFileSync(snapshots[snapshots.length - 1], "utf8");
    expect(latestSnapshotContent).toBe(beforeSecondMutation);
  });
});

describe("get_streams", () => {
  it("returns valid entries plus a reported list of skipped invalid ones on a dangling reference", () => {
    addStream(root, sourceEntry("s1"));
    addStream(root, sourceEntry("d1", { origin: "derived", source_stream_ids: ["s1"] }));

    // Simulate a hand-edit that introduces a dangling reference by writing the ledger directly.
    const { ledgerFile } = workspacePaths(root);
    const raw = parseYaml(fs.readFileSync(ledgerFile, "utf8"));
    raw.streams.find((e: { id: string }) => e.id === "d1").source_stream_ids = ["does-not-exist"];
    fs.writeFileSync(ledgerFile, stringifyYaml(raw), "utf8");

    const result = getStreams(root);
    expect(result.entries.map((e) => e.id)).toEqual(["s1"]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reasons.join(" ")).toContain("does-not-exist");
  });
});
