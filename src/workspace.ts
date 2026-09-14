import path from "node:path";

/** Layout of an `openflow init`-created workspace, relative to the workspace root. */
export function workspacePaths(root: string) {
  const openflowDir = path.join(root, ".openflow");
  return {
    root,
    openflowDir,
    ledgerFile: path.join(openflowDir, "ledger.yaml"),
    ledgerSnapshotsDir: path.join(openflowDir, "snapshots", "ledger"),
    manifestFile: path.join(openflowDir, "manifest.json"),
    streamsDir: path.join(root, "streams"),
    queueFile: path.join(root, "queue.md"),
    claudeSkillsDir: path.join(root, ".claude", "skills"),
    claudeCommandsDir: path.join(root, ".claude", "commands", "flow"),
    agentsSkillsDir: path.join(root, ".agents", "skills"),
  };
}

export function streamDir(root: string, streamId: string): string {
  return path.join(workspacePaths(root).streamsDir, streamId);
}

export function streamRawDir(root: string, streamId: string): string {
  return path.join(streamDir(root, streamId), "raw");
}

export function streamNormalizedDir(root: string, streamId: string): string {
  return path.join(streamDir(root, streamId), "normalized");
}

/** Sortable, filesystem-safe version stamp shared by ledger snapshots and stream snapshots. */
export function versionStamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}
