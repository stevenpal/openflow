import { z } from "zod";
import { STREAM_SHAPES } from "./types.js";
import type { LedgerEntry } from "./types.js";

export const ledgerEntrySchema = z
  .object({
    id: z.string().min(1, "id is required"),
    descriptor: z.string().min(1, "descriptor is required"),
    type: z.enum(STREAM_SHAPES),
    origin: z.enum(["source", "derived"]),
    source_stream_ids: z.array(z.string().min(1)).default([]),
    syncable: z.boolean(),
    description: z.string().min(1, "description is required"),
    intents: z.array(z.string().min(1)).default([]),
    added_at: z.string().min(1, "added_at is required"),
    last_synced_at: z.string().nullable().default(null),
  })
  .strict();

export interface SchemaValidationResult {
  ok: boolean;
  errors: string[];
}

/** Schema-only validation for a single entry (no referential integrity checks). */
export function validateEntrySchema(entry: unknown): SchemaValidationResult {
  const result = ledgerEntrySchema.safeParse(entry);
  if (result.success) {
    return { ok: true, errors: [] };
  }
  return {
    ok: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  };
}

/**
 * Origin/source_stream_ids consistency: source streams carry no source_stream_ids, derived
 * streams must declare at least one. Full referential integrity (existence + one-level-deep)
 * is checked ledger-wide in referential-integrity.ts, since it needs every entry to evaluate.
 */
export function validateEntryOriginShape(entry: LedgerEntry): SchemaValidationResult {
  const errors: string[] = [];
  if (entry.origin === "source" && entry.source_stream_ids.length > 0) {
    errors.push("source_stream_ids must be empty for origin: source");
  }
  if (entry.origin === "derived" && entry.source_stream_ids.length === 0) {
    errors.push("source_stream_ids must be non-empty for origin: derived");
  }
  return { ok: errors.length === 0, errors };
}
