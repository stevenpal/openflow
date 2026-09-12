import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { writeSnapshot, listSnapshots } from "../src/streams/storage.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = makeTempWorkspace();
});
afterEach(() => cleanupWorkspace(root));

describe("per-stream snapshot storage", () => {
  it("a second sync produces a new versioned snapshot without overwriting the prior one", () => {
    const first = writeSnapshot(root, "s1", "normalized", "md", "v1 content", new Date("2026-01-01T00:00:00Z"));
    const second = writeSnapshot(root, "s1", "normalized", "md", "v2 content", new Date("2026-01-02T00:00:00Z"));

    expect(first.path).not.toBe(second.path);
    expect(listSnapshots(root, "s1", "normalized")).toHaveLength(2);
    expect(second.changed).toBe(true);
    expect(second.previousPath).toBe(first.path);
  });

  it("reports unchanged when a resync produces identical content", () => {
    writeSnapshot(root, "s1", "normalized", "md", "same", new Date("2026-01-01T00:00:00Z"));
    const resync = writeSnapshot(root, "s1", "normalized", "md", "same", new Date("2026-01-02T00:00:00Z"));
    expect(resync.changed).toBe(false);
  });

  it("disambiguates two snapshots written in the same millisecond instead of overwriting", () => {
    const sameInstant = new Date("2026-01-01T00:00:00.000Z");
    const first = writeSnapshot(root, "s1", "normalized", "md", "v1", sameInstant);
    const second = writeSnapshot(root, "s1", "normalized", "md", "v2", sameInstant);

    expect(first.path).not.toBe(second.path);
    expect(listSnapshots(root, "s1", "normalized")).toHaveLength(2);
    expect(second.previousPath).toBe(first.path);
    expect(second.changed).toBe(true);
  });

  it("keeps raw and normalized snapshots in separate locations", () => {
    writeSnapshot(root, "s1", "raw", "json", "{}", new Date("2026-01-01T00:00:00Z"));
    writeSnapshot(root, "s1", "normalized", "md", "# x", new Date("2026-01-01T00:00:00Z"));
    expect(listSnapshots(root, "s1", "raw")).toHaveLength(1);
    expect(listSnapshots(root, "s1", "normalized")).toHaveLength(1);
  });
});
