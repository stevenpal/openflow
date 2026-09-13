import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { syncSkills, syncCommands } from "../src/install.js";
import { makeTempWorkspace, cleanupWorkspace } from "./helpers.js";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) cleanupWorkspace(dirs.pop()!);
});

function writeSkill(templatesDir: string, name: string, content = "content"): void {
  const dir = path.join(templatesDir, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), content, "utf8");
}

describe("syncSkills", () => {
  it("installs the current template skills into an empty workspace skills dir", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates");
    const workspaceSkillsDir = path.join(root, "workspace-skills");
    writeSkill(templatesDir, "flow-add");
    writeSkill(templatesDir, "flow-ask");

    const installed = syncSkills(templatesDir, workspaceSkillsDir, []);

    expect(installed.sort()).toEqual(["flow-add", "flow-ask"]);
    expect(fs.existsSync(path.join(workspaceSkillsDir, "flow-add", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(workspaceSkillsDir, "flow-ask", "SKILL.md"))).toBe(true);
  });

  it("leaves an unrelated existing skill directory untouched", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates");
    const workspaceSkillsDir = path.join(root, "workspace-skills");
    writeSkill(templatesDir, "flow-add");
    const unrelatedDir = path.join(workspaceSkillsDir, "my-own-skill");
    fs.mkdirSync(unrelatedDir, { recursive: true });
    fs.writeFileSync(path.join(unrelatedDir, "SKILL.md"), "mine", "utf8");

    syncSkills(templatesDir, workspaceSkillsDir, []);

    expect(fs.readFileSync(path.join(unrelatedDir, "SKILL.md"), "utf8")).toBe("mine");
  });

  it("removes a previously-installed skill that no longer exists upstream", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates");
    const workspaceSkillsDir = path.join(root, "workspace-skills");
    writeSkill(templatesDir, "flow-add");
    fs.mkdirSync(path.join(workspaceSkillsDir, "flow-old"), { recursive: true });
    fs.writeFileSync(path.join(workspaceSkillsDir, "flow-old", "SKILL.md"), "old", "utf8");

    const installed = syncSkills(templatesDir, workspaceSkillsDir, ["flow-old"]);

    expect(installed).toEqual(["flow-add"]);
    expect(fs.existsSync(path.join(workspaceSkillsDir, "flow-old"))).toBe(false);
  });

  it("renamed skill ends up present only under its new name", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates");
    const workspaceSkillsDir = path.join(root, "workspace-skills");
    writeSkill(templatesDir, "flow-added");

    const installed = syncSkills(templatesDir, workspaceSkillsDir, ["flow-add"]);

    expect(installed).toEqual(["flow-added"]);
    expect(fs.existsSync(path.join(workspaceSkillsDir, "flow-add"))).toBe(false);
    expect(fs.existsSync(path.join(workspaceSkillsDir, "flow-added", "SKILL.md"))).toBe(true);
  });

  it("overwrites content of an already-installed skill with the new template content", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates");
    const workspaceSkillsDir = path.join(root, "workspace-skills");
    writeSkill(templatesDir, "flow-add", "new content");
    fs.mkdirSync(path.join(workspaceSkillsDir, "flow-add"), { recursive: true });
    fs.writeFileSync(path.join(workspaceSkillsDir, "flow-add", "SKILL.md"), "old content", "utf8");

    syncSkills(templatesDir, workspaceSkillsDir, ["flow-add"]);

    expect(fs.readFileSync(path.join(workspaceSkillsDir, "flow-add", "SKILL.md"), "utf8")).toBe("new content");
  });
});

describe("syncCommands", () => {
  it("replaces the workspace commands dir wholesale, removing stale files", () => {
    const root = makeTempWorkspace();
    dirs.push(root);
    const templatesDir = path.join(root, "templates-commands");
    const workspaceCommandsDir = path.join(root, "workspace-commands");
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.writeFileSync(path.join(templatesDir, "add.md"), "add command", "utf8");
    fs.mkdirSync(workspaceCommandsDir, { recursive: true });
    fs.writeFileSync(path.join(workspaceCommandsDir, "stale.md"), "stale", "utf8");

    syncCommands(templatesDir, workspaceCommandsDir);

    expect(fs.existsSync(path.join(workspaceCommandsDir, "stale.md"))).toBe(false);
    expect(fs.readFileSync(path.join(workspaceCommandsDir, "add.md"), "utf8")).toBe("add command");
  });
});
