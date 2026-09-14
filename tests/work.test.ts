import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initWorkspace } from "../src/commands/init.js";
import { addStream, getStreams, updateStream } from "../src/ledger/store.js";
import { applyStreamSync } from "../src/sync.js";
import { applyIntentOperation } from "../src/ledger/intents.js";
import { listSnapshots, latestSnapshot } from "../src/streams/storage.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeTempWorkspace();
  initWorkspace(root);
  addStream(root, {
    id: "touched",
    descriptor: "fetch touched",
    type: "chat",
    origin: "source",
    syncable: true,
    description: "the stream a queue item is tied to",
    added_at: "2026-01-01T00:00:00Z",
  });
  addStream(root, {
    id: "untouched",
    descriptor: "fetch untouched",
    type: "chat",
    origin: "source",
    syncable: true,
    description: "an unrelated tracked stream",
    added_at: "2026-01-01T00:00:00Z",
  });
  applyStreamSync(root, "touched", "md", { ok: true, normalizedContent: "v1" });
  applyStreamSync(root, "untouched", "md", { ok: true, normalizedContent: "v1" });
});
afterEach(() => cleanupWorkspace(root));

describe("/flow:work — scoped pre-work sync", () => {
  it("syncing the touched stream leaves the untouched stream's snapshots unchanged", () => {
    applyStreamSync(root, "touched", "md", { ok: true, normalizedContent: "v2" });

    expect(listSnapshots(root, "touched", "normalized")).toHaveLength(2);
    expect(listSnapshots(root, "untouched", "normalized")).toHaveLength(1);
  });

  it("a meaningful change is reported via the finding's changed flag before proceeding", () => {
    const finding = applyStreamSync(root, "touched", "md", { ok: true, normalizedContent: "v2 - new detail" });
    expect(finding.changed).toBe(true);
    expect(finding.diffText).toContain("+v2 - new detail");
  });

  it("a failed scoped sync leaves the last good snapshot available to proceed against", () => {
    const before = latestSnapshot(root, "touched", "normalized");
    const finding = applyStreamSync(root, "touched", "md", { ok: false, failure: "MCP server unreachable" });

    expect(finding.failure).toBe("MCP server unreachable");
    expect(latestSnapshot(root, "touched", "normalized")).toBe(before);
  });
});

describe("/flow:work — in-place intents rewriting", () => {
  it("sharpens a stream's matching intent in place when working an item reveals a sharper reason", () => {
    updateStream(root, "touched", { intents: ["generic reason it matters"] });

    const current = getStreams(root).entries.find((e) => e.id === "touched")!;
    const nextIntents = applyIntentOperation(current.intents, {
      kind: "sharpen",
      match: "generic reason it matters",
      replacement: "Acme asked for a contract amendment by Friday",
    });
    updateStream(root, "touched", { intents: nextIntents });

    const updated = getStreams(root).entries.find((e) => e.id === "touched")!;
    expect(updated.intents).toEqual(["Acme asked for a contract amendment by Friday"]);
  });
});
