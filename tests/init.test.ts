import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { initWorkspace } from "../src/commands/init.js";
import { workspacePaths } from "../src/workspace.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) cleanupWorkspace(dirs.pop()!);
});

describe("openflow init", () => {
  it("scaffolds all expected paths in an empty folder", () => {
    const root = makeTempWorkspace();
    dirs.push(root);

    initWorkspace(root);
    const paths = workspacePaths(root);

    expect(fs.existsSync(paths.streamsDir)).toBe(true);
    expect(fs.existsSync(paths.ledgerFile)).toBe(true);
    expect(fs.existsSync(paths.queueFile)).toBe(true);
    expect(fs.existsSync(paths.claudeSkillsDir)).toBe(true);
    expect(fs.readdirSync(paths.claudeSkillsDir).length).toBeGreaterThan(0);
    expect(fs.existsSync(paths.claudeCommandsDir)).toBe(true);
    expect(fs.readdirSync(paths.claudeCommandsDir).length).toBeGreaterThan(0);

    const ledgerContent = fs.readFileSync(paths.ledgerFile, "utf8");
    expect(ledgerContent).toContain("streams");

    expect(fs.existsSync(paths.manifestFile)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(paths.manifestFile, "utf8"));
    expect(typeof manifest.cliVersion).toBe("string");
    expect(manifest.installedSkills.sort()).toEqual(fs.readdirSync(paths.claudeSkillsDir).sort());
    expect(typeof manifest.installedAt).toBe("string");
    expect(typeof manifest.updatedAt).toBe("string");
  });

  it("keeps two workspaces fully independent", () => {
    const rootA = makeTempWorkspace();
    const rootB = makeTempWorkspace();
    dirs.push(rootA, rootB);

    initWorkspace(rootA);
    initWorkspace(rootB);

    const pathsA = workspacePaths(rootA);
    const pathsB = workspacePaths(rootB);

    expect(pathsA.ledgerFile).not.toBe(pathsB.ledgerFile);
    expect(fs.realpathSync(pathsA.root)).not.toBe(fs.realpathSync(pathsB.root));

    // Writing a stream into A's streams dir must not appear in B's.
    fs.writeFileSync(`${pathsA.streamsDir}/marker.txt`, "a");
    expect(fs.existsSync(`${pathsB.streamsDir}/marker.txt`)).toBe(false);
  });
});
