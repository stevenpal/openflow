import fs from "node:fs";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { workspacePaths } from "../workspace.js";
import type { Ledger, LedgerEntry } from "./types.js";
import { validateEntrySchema, validateEntryOriginShape } from "./schema.js";
import { checkReferentialIntegrity, checkUniqueIds } from "./referential-integrity.js";
import { snapshotLedger } from "./snapshot.js";

export class LedgerValidationError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Ledger mutation rejected:\n- ${reasons.join("\n- ")}`);
    this.name = "LedgerValidationError";
  }
}

export class LedgerNotFoundError extends Error {
  constructor(root: string) {
    super(`No ledger found at ${workspacePaths(root).ledgerFile}. Run "openflow init" first.`);
    this.name = "LedgerNotFoundError";
  }
}

function readLedgerRaw(root: string): { streams: unknown[] } {
  const { ledgerFile } = workspacePaths(root);
  if (!fs.existsSync(ledgerFile)) {
    throw new LedgerNotFoundError(root);
  }
  const contents = fs.readFileSync(ledgerFile, "utf8");
  const parsed = contents.trim().length > 0 ? parseYaml(contents) : { streams: [] };
  const streams = Array.isArray(parsed?.streams) ? parsed.streams : [];
  return { streams };
}

function writeLedgerRaw(root: string, ledger: Ledger): void {
  const { ledgerFile } = workspacePaths(root);
  fs.writeFileSync(ledgerFile, stringifyYaml(ledger), "utf8");
}

export interface SkippedEntry {
  raw: unknown;
  reasons: string[];
}

export interface GetStreamsResult {
  entries: LedgerEntry[];
  skipped: SkippedEntry[];
}

/**
 * Validating read accessor: re-checks schema, origin/source_stream_ids shape, and referential
 * integrity on every call. Invalid entries are reported (never silently dropped) and excluded
 * from `entries`; the caller proceeds with the valid subset.
 */
export function getStreams(root: string): GetStreamsResult {
  const { streams: rawEntries } = readLedgerRaw(root);

  const schemaValid: LedgerEntry[] = [];
  const skipped: SkippedEntry[] = [];

  for (const raw of rawEntries) {
    const schemaResult = validateEntrySchema(raw);
    if (!schemaResult.ok) {
      skipped.push({ raw, reasons: schemaResult.errors });
      continue;
    }
    const entry = raw as LedgerEntry;
    const shapeResult = validateEntryOriginShape(entry);
    if (!shapeResult.ok) {
      skipped.push({ raw, reasons: shapeResult.errors });
      continue;
    }
    schemaValid.push(entry);
  }

  const duplicateIssues = checkUniqueIds(schemaValid);
  const duplicateIds = new Set(duplicateIssues.map((issue) => issue.entryId));

  const candidates = schemaValid.filter((entry) => !duplicateIds.has(entry.id));
  for (const entry of schemaValid) {
    if (duplicateIds.has(entry.id)) {
      skipped.push({
        raw: entry,
        reasons: duplicateIssues.filter((issue) => issue.entryId === entry.id).map((issue) => issue.reason),
      });
    }
  }

  const refIssues = checkReferentialIntegrity(candidates);
  const invalidIds = new Set(refIssues.map((issue) => issue.entryId));

  const entries = candidates.filter((entry) => !invalidIds.has(entry.id));
  for (const entry of candidates) {
    if (invalidIds.has(entry.id)) {
      skipped.push({
        raw: entry,
        reasons: refIssues.filter((issue) => issue.entryId === entry.id).map((issue) => issue.reason),
      });
    }
  }

  return { entries, skipped };
}

function assertValidMutation(candidate: LedgerEntry, restOfLedger: LedgerEntry[]): void {
  const schemaResult = validateEntrySchema(candidate);
  if (!schemaResult.ok) {
    throw new LedgerValidationError(schemaResult.errors);
  }
  const shapeResult = validateEntryOriginShape(candidate);
  if (!shapeResult.ok) {
    throw new LedgerValidationError(shapeResult.errors);
  }
  const allEntries = [...restOfLedger, candidate];
  const dupIssues = checkUniqueIds(allEntries).filter((issue) => issue.entryId === candidate.id);
  if (dupIssues.length > 0) {
    throw new LedgerValidationError(dupIssues.map((issue) => issue.reason));
  }
  const refIssues = checkReferentialIntegrity(allEntries).filter((issue) => issue.entryId === candidate.id);
  if (refIssues.length > 0) {
    throw new LedgerValidationError(refIssues.map((issue) => issue.reason));
  }
}

export type NewStreamEntry = Omit<LedgerEntry, "source_stream_ids" | "intents" | "last_synced_at"> &
  Partial<Pick<LedgerEntry, "source_stream_ids" | "intents" | "last_synced_at">>;

/** The only path for agent-initiated ledger additions. Validates before writing. */
export function addStream(root: string, input: NewStreamEntry): LedgerEntry {
  const { streams: rawExisting } = readLedgerRaw(root);
  const existing = rawExisting as LedgerEntry[];

  const candidate: LedgerEntry = {
    ...input,
    source_stream_ids: input.source_stream_ids ?? [],
    intents: input.intents ?? [],
    last_synced_at: input.last_synced_at ?? null,
  };

  assertValidMutation(candidate, existing);

  snapshotLedger(root);
  writeLedgerRaw(root, { streams: [...existing, candidate] });
  return candidate;
}

/** The only path for agent-initiated ledger removals. Never touches the remote source. */
export function removeStream(root: string, id: string): void {
  const { streams: rawExisting } = readLedgerRaw(root);
  const existing = rawExisting as LedgerEntry[];

  if (!existing.some((entry) => entry.id === id)) {
    throw new LedgerValidationError([`no stream with id "${id}" exists`]);
  }

  const dependents = existing.filter(
    (entry) => entry.origin === "derived" && entry.source_stream_ids.includes(id),
  );
  if (dependents.length > 0) {
    throw new LedgerValidationError([
      `stream "${id}" is still referenced by derived stream(s): ${dependents.map((e) => e.id).join(", ")}`,
    ]);
  }

  snapshotLedger(root);
  writeLedgerRaw(root, { streams: existing.filter((entry) => entry.id !== id) });
}

/** The only path for agent-initiated ledger field updates. Validates the merged result. */
export function updateStream(root: string, id: string, patch: Partial<LedgerEntry>): LedgerEntry {
  const { streams: rawExisting } = readLedgerRaw(root);
  const existing = rawExisting as LedgerEntry[];

  const current = existing.find((entry) => entry.id === id);
  if (!current) {
    throw new LedgerValidationError([`no stream with id "${id}" exists`]);
  }

  const candidate: LedgerEntry = { ...current, ...patch, id: current.id };
  const restOfLedger = existing.filter((entry) => entry.id !== id);
  assertValidMutation(candidate, restOfLedger);

  snapshotLedger(root);
  writeLedgerRaw(root, { streams: [...restOfLedger, candidate] });
  return candidate;
}

export function initEmptyLedger(root: string): void {
  writeLedgerRaw(root, { streams: [] });
}
