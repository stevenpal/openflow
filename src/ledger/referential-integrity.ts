import type { LedgerEntry } from "./types.js";

export interface ReferentialIntegrityIssue {
  entryId: string;
  reason: string;
}

/**
 * Checks the one-level-deep derived-stream constraint and dangling references across a whole
 * ledger. Must run over every entry at once (unlike schema validation) because a single entry
 * can't tell whether the streams it references exist or are themselves derived.
 */
export function checkReferentialIntegrity(entries: LedgerEntry[]): ReferentialIntegrityIssue[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const issues: ReferentialIntegrityIssue[] = [];

  for (const entry of entries) {
    for (const sourceId of entry.source_stream_ids) {
      const referenced = byId.get(sourceId);
      if (!referenced) {
        issues.push({
          entryId: entry.id,
          reason: `source_stream_ids references "${sourceId}", which does not exist`,
        });
        continue;
      }
      if (referenced.origin !== "source") {
        issues.push({
          entryId: entry.id,
          reason: `source_stream_ids references "${sourceId}", which is a derived stream (derived streams may only reference origin: source streams)`,
        });
      }
    }
  }

  return issues;
}

export function checkUniqueIds(entries: LedgerEntry[]): ReferentialIntegrityIssue[] {
  const seen = new Set<string>();
  const issues: ReferentialIntegrityIssue[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      issues.push({ entryId: entry.id, reason: `duplicate id "${entry.id}"` });
    }
    seen.add(entry.id);
  }
  return issues;
}
