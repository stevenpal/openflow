import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import { initWorkspace } from "../src/commands/init.js";
import { addStream, removeStream, updateStream, getStreams } from "../src/ledger/store.js";
import { writeSnapshot, removeStreamFolder, listSnapshots } from "../src/streams/storage.js";
import { streamDir } from "../src/workspace.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeTempWorkspace();
  initWorkspace(root);
});
afterEach(() => cleanupWorkspace(root));

function syncWorkList(): string[] {
  return getStreams(root)
    .entries.filter((e) => e.origin === "source" && e.syncable)
    .map((e) => e.id);
}

describe("/flow:manage — toggling sync state", () => {
  it("a stream switched to static is excluded from the next sync's work list; syncable includes it", () => {
    addStream(root, {
      id: "s1",
      descriptor: "fetch s1",
      type: "chat",
      origin: "source",
      syncable: true,
      description: "d",
      added_at: "2026-01-01T00:00:00Z",
    });
    expect(syncWorkList()).toContain("s1");

    updateStream(root, "s1", { syncable: false });
    expect(syncWorkList()).not.toContain("s1");

    updateStream(root, "s1", { syncable: true });
    expect(syncWorkList()).toContain("s1");
  });
});

describe("/flow:manage — removing a stream", () => {
  it("deletes the local folder and ledger entry, and never touches anything outside the workspace", () => {
    addStream(root, {
      id: "s1",
      descriptor: "fetch s1",
      type: "chat",
      origin: "source",
      syncable: true,
      description: "d",
      added_at: "2026-01-01T00:00:00Z",
    });
    writeSnapshot(root, "s1", "normalized", "md", "content");
    expect(listSnapshots(root, "s1", "normalized")).toHaveLength(1);

    // Marker representing the "remote resource" a stream points to, outside the workspace.
    const remoteMarker = `${root}-remote-marker`;
    fs.writeFileSync(remoteMarker, "untouched");

    removeStream(root, "s1");
    removeStreamFolder(root, "s1");

    expect(getStreams(root).entries).toEqual([]);
    expect(fs.existsSync(streamDir(root, "s1"))).toBe(false);
    expect(fs.readFileSync(remoteMarker, "utf8")).toBe("untouched");

    fs.rmSync(remoteMarker);
  });
});
