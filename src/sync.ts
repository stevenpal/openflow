import fs from "node:fs";
import { writeSnapshot } from "./streams/storage.js";

export interface SyncFinding {
  id: string;
  changed: boolean;
  failure?: string;
  addedLines?: string[];
  removedLines?: string[];
}

/** Line-level diff highlights between a stream's prior and current normalized snapshot. */
export function diffLines(previous: string | null, current: string): { addedLines: string[]; removedLines: string[] } {
  const prevLines = new Set((previous ?? "").split("\n").filter((l) => l.length > 0));
  const currLines = new Set(current.split("\n").filter((l) => l.length > 0));
  return {
    addedLines: [...currLines].filter((l) => !prevLines.has(l)),
    removedLines: [...prevLines].filter((l) => !currLines.has(l)),
  };
}

export type RetrievalResult = { ok: true; normalizedContent: string } | { ok: false; failure: string };

/**
 * The structured finding a per-stream sync subagent reports back to the main sync agent: either
 * a changed/unchanged result with diff highlights, or — on any retrieval failure — the specific
 * cause, leaving the stream at its last good snapshot rather than guessing or overwriting it.
 */
export function applyStreamSync(root: string, streamId: string, ext: string, retrieval: RetrievalResult): SyncFinding {
  if (!retrieval.ok) {
    return { id: streamId, changed: false, failure: retrieval.failure };
  }

  const result = writeSnapshot(root, streamId, "normalized", ext, retrieval.normalizedContent);
  const previousContent = result.previousPath ? fs.readFileSync(result.previousPath, "utf8") : null;
  const diff = diffLines(previousContent, retrieval.normalizedContent);

  return {
    id: streamId,
    changed: result.changed,
    addedLines: diff.addedLines,
    removedLines: diff.removedLines,
  };
}

export type LocalFileReadResult = { ok: true; content: string } | { ok: false; reason: string };

/** Detects a moved/renamed local file source before attempting to read it, for uniform failure reporting. */
export function readLocalFileSource(path: string): LocalFileReadResult {
  if (!fs.existsSync(path)) {
    return { ok: false, reason: `file not found at recorded path "${path}" (it may have moved or been renamed)` };
  }
  return { ok: true, content: fs.readFileSync(path, "utf8") };
}
