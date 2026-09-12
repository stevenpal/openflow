import type { LedgerEntry } from "./ledger/types.js";

/**
 * A derived stream recomputes only when `/flow:sync` finds a changed source and the derived
 * stream is itself syncable — never on an independent schedule, and never at all if it was added
 * static (static derived streams compute once, at add-time, and are frozen after that).
 */
export function shouldRecomputeDerived(entry: LedgerEntry, changedSourceStreamIds: ReadonlySet<string>): boolean {
  if (entry.origin !== "derived" || !entry.syncable) {
    return false;
  }
  return entry.source_stream_ids.some((id) => changedSourceStreamIds.has(id));
}
