import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { cliVersion, readManifest, writeManifest } from "../src/manifest.js";
import { workspacePaths } from "../src/workspace.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) cleanupWorkspace(dirs.pop()!);
});

describe("cliVersion", () => {
  it("returns the version from package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(cliVersion()).toBe(pkg.version);
  });
});

describe("readManifest / writeManifest", () => {
  it("returns undefined when no manifest exists", () => {
    const root = makeTempWorkspace();
    dirs.push(root);

    expect(readManifest(root)).toBeUndefined();
  });

  it("round-trips a written manifest", () => {
    const root = makeTempWorkspace();
    dirs.push(root);

    const manifest = {
      cliVersion: "0.1.0",
      installedSkills: ["flow-add", "flow-ask"],
      installedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    writeManifest(root, manifest);

    expect(readManifest(root)).toEqual(manifest);
    expect(fs.existsSync(workspacePaths(root).manifestFile)).toBe(true);
  });
});
