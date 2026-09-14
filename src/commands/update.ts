import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { workspacePaths } from "../workspace.js";
import { syncSkills, syncCommands } from "../install.js";
import { cliVersion, readManifest, writeManifest } from "../manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/commands/update.js -> package root -> templates/
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

export class UpdateError extends Error {}

export interface UpdateResult {
  updated: boolean;
  fromVersion: string | undefined;
  toVersion: string;
  installedSkills: string[];
}

/**
 * Refreshes an initialized workspace's `/flow:*` skills and commands to match the currently
 * installed CLI's templates, per the "installed-version manifest" scheme (see
 * `openspec/changes/add-workspace-update-command`): only ever touches skill directories openflow
 * itself previously installed, and requires `--force` the first time a pre-manifest workspace
 * is updated.
 */
export function updateWorkspace(root: string, opts: { force?: boolean } = {}): UpdateResult {
  const paths = workspacePaths(root);
  if (!fs.existsSync(paths.openflowDir)) {
    throw new UpdateError(`"${root}" is not an OpenFlow workspace (no .openflow/ found); run "openflow init" first`);
  }

  const manifest = readManifest(root);
  const currentVersion = cliVersion();

  if (!manifest && !opts.force) {
    throw new UpdateError(
      "This workspace has no installed-version manifest (it predates this feature). " +
        'Re-run with "openflow update --force" to acknowledge a first-time manifest write.',
    );
  }

  if (manifest && manifest.cliVersion === currentVersion) {
    return { updated: false, fromVersion: manifest.cliVersion, toVersion: currentVersion, installedSkills: manifest.installedSkills };
  }

  const skillsSrc = path.join(TEMPLATES_DIR, "skills");
  const installedSkills = syncSkills(skillsSrc, paths.claudeSkillsDir, manifest?.installedSkills ?? []);
  syncSkills(skillsSrc, paths.agentsSkillsDir, manifest?.installedSkills ?? []);

  const commandsSrc = path.join(TEMPLATES_DIR, "commands", "flow");
  syncCommands(commandsSrc, paths.claudeCommandsDir);

  const now = new Date().toISOString();
  writeManifest(root, {
    cliVersion: currentVersion,
    installedSkills,
    installedAt: manifest?.installedAt ?? now,
    updatedAt: now,
  });

  return { updated: true, fromVersion: manifest?.cliVersion, toVersion: currentVersion, installedSkills };
}
