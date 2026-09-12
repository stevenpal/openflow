import fs from "node:fs";
import path from "node:path";
import { streamDir, streamRawDir, streamNormalizedDir, versionStamp } from "../workspace.js";

export type SnapshotKind = "raw" | "normalized";

function dirFor(root: string, streamId: string, kind: SnapshotKind): string {
  return kind === "raw" ? streamRawDir(root, streamId) : streamNormalizedDir(root, streamId);
}

/** Lists a stream's snapshots for one kind, oldest first (filenames are sortable version stamps). */
export function listSnapshots(root: string, streamId: string, kind: SnapshotKind): string[] {
  const dir = dirFor(root, streamId, kind);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .sort()
    .map((name) => path.join(dir, name));
}

export function latestSnapshot(root: string, streamId: string, kind: SnapshotKind): string | null {
  const snapshots = listSnapshots(root, streamId, kind);
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/**
 * Deletes a stream's local folder (raw + normalized snapshots) only. Never touches anything
 * outside the workspace, so the remote resource a stream points to is never affected.
 */
export function removeStreamFolder(root: string, streamId: string): void {
  fs.rmSync(streamDir(root, streamId), { recursive: true, force: true });
}

export interface WriteSnapshotResult {
  path: string;
  previousPath: string | null;
  changed: boolean;
}

/**
 * Writes a new versioned snapshot for a stream without overwriting any prior snapshot. For
 * `normalized` snapshots, reports whether content differs from the immediately prior one so
 * `/flow:sync` can tell a real change from a no-op refresh.
 */
export function writeSnapshot(
  root: string,
  streamId: string,
  kind: SnapshotKind,
  extension: string,
  content: string,
  at: Date = new Date(),
): WriteSnapshotResult {
  const dir = dirFor(root, streamId, kind);
  fs.mkdirSync(dir, { recursive: true });

  const previousPath = latestSnapshot(root, streamId, kind);
  const previousContent = previousPath ? fs.readFileSync(previousPath, "utf8") : null;

  // Two snapshots can land in the same millisecond (rapid successive syncs, or a fast test).
  // Advance by 1ms until a free slot is found, rather than let the second write silently
  // overwrite the first — this also keeps filenames sortable in true chronological order.
  let stampedAt = at;
  let filePath = path.join(dir, `${versionStamp(stampedAt)}.${extension}`);
  while (fs.existsSync(filePath)) {
    stampedAt = new Date(stampedAt.getTime() + 1);
    filePath = path.join(dir, `${versionStamp(stampedAt)}.${extension}`);
  }
  fs.writeFileSync(filePath, content, "utf8");

  return {
    path: filePath,
    previousPath,
    changed: previousContent === null || previousContent !== content,
  };
}
