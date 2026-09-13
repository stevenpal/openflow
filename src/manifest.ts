import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { workspacePaths } from "./workspace.js";

export interface WorkspaceManifest {
  cliVersion: string;
  installedSkills: string[];
  installedAt: string;
  updatedAt: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/manifest.js -> package root -> package.json
const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");

/** The installed `openflow` CLI's own version, from its package.json. */
export function cliVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8")) as { version: string };
  return pkg.version;
}

/** Reads a workspace's installed-version manifest, or `undefined` if none exists. */
export function readManifest(root: string): WorkspaceManifest | undefined {
  const { manifestFile } = workspacePaths(root);
  if (!fs.existsSync(manifestFile)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(manifestFile, "utf8")) as WorkspaceManifest;
}

export function writeManifest(root: string, manifest: WorkspaceManifest): void {
  const { manifestFile, openflowDir } = workspacePaths(root);
  fs.mkdirSync(openflowDir, { recursive: true });
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
