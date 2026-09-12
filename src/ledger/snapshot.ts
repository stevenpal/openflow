import fs from "node:fs";
import path from "node:path";
import { workspacePaths, versionStamp } from "../workspace.js";

/**
 * Copies the ledger file's current on-disk content into the snapshots dir before a mutation is
 * applied. A no-op (returns null) when the ledger file doesn't exist yet (first-ever add).
 */
export function snapshotLedger(root: string, at: Date = new Date()): string | null {
  const { ledgerFile, ledgerSnapshotsDir } = workspacePaths(root);
  if (!fs.existsSync(ledgerFile)) {
    return null;
  }
  fs.mkdirSync(ledgerSnapshotsDir, { recursive: true });
  const snapshotPath = path.join(ledgerSnapshotsDir, `${versionStamp(at)}.yaml`);
  fs.copyFileSync(ledgerFile, snapshotPath);
  return snapshotPath;
}

export function listLedgerSnapshots(root: string): string[] {
  const { ledgerSnapshotsDir } = workspacePaths(root);
  if (!fs.existsSync(ledgerSnapshotsDir)) {
    return [];
  }
  return fs
    .readdirSync(ledgerSnapshotsDir)
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => path.join(ledgerSnapshotsDir, name));
}
