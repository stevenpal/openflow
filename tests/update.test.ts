import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { initWorkspace } from "../src/commands/init.js";
import { updateWorkspace, UpdateError } from "../src/commands/update.js";
import { readManifest, writeManifest, cliVersion } from "../src/manifest.js";
import { workspacePaths } from "../src/workspace.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) cleanupWorkspace(dirs.pop()!);
});

describe("openflow update", () => {
  it("fails on a folder that was never initialized", () => {
    const root = makeTempWorkspace();
    dirs.push(root);

    expect(() => updateWorkspace(root)).toThrow(UpdateError);
    expect(fs.existsSync(workspacePaths(root).manifestFile)).toBe(false);
  });

  it("requires --force when the workspace has no manifest", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    initWorkspace(root);
    const paths = workspacePaths(root);
    fs.rmSync(paths.manifestFile);
    const skillsBefore = fs.readdirSync(paths.claudeSkillsDir).sort();

    expect(() => updateWorkspace(root)).toThrow(UpdateError);
    expect(fs.existsSync(paths.manifestFile)).toBe(false);
    expect(fs.readdirSync(paths.claudeSkillsDir).sort()).toEqual(skillsBefore);
  });

  it("proceeds as a first-time manifest write with --force on a pre-manifest workspace", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    initWorkspace(root);
    const paths = workspacePaths(root);
    fs.rmSync(paths.manifestFile);

    const result = updateWorkspace(root, { force: true });

    expect(result.updated).toBe(true);
    expect(readManifest(root)?.cliVersion).toBe(cliVersion());
  });

  it("reports already up to date and makes no changes when versions match", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    initWorkspace(root);
    const paths = workspacePaths(root);
    const commandsBefore = fs.readdirSync(paths.claudeCommandsDir).sort();

    const result = updateWorkspace(root);

    expect(result.updated).toBe(false);
    expect(fs.readdirSync(paths.claudeCommandsDir).sort()).toEqual(commandsBefore);
  });

  it("removes a stale openflow skill, leaves unrelated skills, refreshes commands, and updates the manifest on a version bump", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    initWorkspace(root);
    const paths = workspacePaths(root);

    // Simulate an older installed version with a skill that no longer exists upstream.
    const manifest = readManifest(root)!;
    fs.mkdirSync(path.join(paths.claudeSkillsDir, "flow-old"), { recursive: true });
    fs.writeFileSync(path.join(paths.claudeSkillsDir, "flow-old", "SKILL.md"), "old", "utf8");
    fs.mkdirSync(path.join(paths.claudeSkillsDir, "my-own-skill"), { recursive: true });
    fs.writeFileSync(path.join(paths.claudeSkillsDir, "my-own-skill", "SKILL.md"), "mine", "utf8");
    fs.writeFileSync(path.join(paths.claudeCommandsDir, "stale.md"), "stale", "utf8");
    writeManifest(root, { ...manifest, cliVersion: "0.0.0-test", installedSkills: [...manifest.installedSkills, "flow-old"] });

    const result = updateWorkspace(root);

    expect(result.updated).toBe(true);
    expect(fs.existsSync(path.join(paths.claudeSkillsDir, "flow-old"))).toBe(false);
    expect(fs.readFileSync(path.join(paths.claudeSkillsDir, "my-own-skill", "SKILL.md"), "utf8")).toBe("mine");
    expect(fs.existsSync(path.join(paths.claudeCommandsDir, "stale.md"))).toBe(false);
    expect(readManifest(root)?.cliVersion).toBe(cliVersion());
    expect(readManifest(root)?.installedSkills.sort()).toEqual(
      fs.readdirSync(paths.claudeSkillsDir).filter((n) => n !== "my-own-skill").sort(),
    );
  });
});
