import fs from "node:fs";
import path from "node:path";

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Syncs the openflow-owned skill directories in `workspaceSkillsDir` to match
 * `templatesSkillsDir`, without ever touching an entry that isn't (and wasn't) openflow's own.
 *
 * `workspaceSkillsDir` (`.claude/skills/`) is a flat namespace shared with any other skill the
 * user or another tool has installed there, so this only removes directories listed in
 * `previousInstalledSkills` that no longer exist upstream, then overwrites/adds the current
 * template set. Returns the new "installed skills" list to persist in the manifest.
 */
export function syncSkills(
  templatesSkillsDir: string,
  workspaceSkillsDir: string,
  previousInstalledSkills: string[],
): string[] {
  const currentSkillNames = fs
    .readdirSync(templatesSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const currentSkillNameSet = new Set(currentSkillNames);
  for (const staleName of previousInstalledSkills) {
    if (!currentSkillNameSet.has(staleName)) {
      fs.rmSync(path.join(workspaceSkillsDir, staleName), { recursive: true, force: true });
    }
  }

  fs.mkdirSync(workspaceSkillsDir, { recursive: true });
  for (const name of currentSkillNames) {
    copyDir(path.join(templatesSkillsDir, name), path.join(workspaceSkillsDir, name));
  }

  return currentSkillNames;
}

/**
 * Replaces `workspaceCommandsDir` (openflow's own dedicated namespace, e.g. `.claude/commands/flow/`)
 * wholesale with the contents of `templatesCommandsDir`, so stale files from a previous version
 * never linger.
 */
export function syncCommands(templatesCommandsDir: string, workspaceCommandsDir: string): void {
  fs.rmSync(workspaceCommandsDir, { recursive: true, force: true });
  copyDir(templatesCommandsDir, workspaceCommandsDir);
}
