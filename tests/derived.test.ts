import { describe, it, expect } from "vitest";
import { shouldRecomputeDerived } from "../src/derived.js";
import type { LedgerEntry } from "../src/ledger/types.js";

function derivedEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    id: "d1",
    descriptor: "combine s1",
    type: "plain-text",
    origin: "derived",
    source_stream_ids: ["s1"],
    syncable: true,
    description: "derived stream",
    intents: [],
    added_at: "2026-01-01T00:00:00Z",
    last_synced_at: null,
    ...overrides,
  };
}

describe("shouldRecomputeDerived", () => {
  it("recomputes when a source it depends on changed", () => {
    expect(shouldRecomputeDerived(derivedEntry(), new Set(["s1"]))).toBe(true);
  });

  it("does not recompute when no source changed", () => {
    expect(shouldRecomputeDerived(derivedEntry(), new Set(["other"]))).toBe(false);
  });

  it("never recomputes a static derived stream, even when its source changed", () => {
    expect(shouldRecomputeDerived(derivedEntry({ syncable: false }), new Set(["s1"]))).toBe(false);
  });

  it("ignores non-derived entries", () => {
    expect(
      shouldRecomputeDerived(derivedEntry({ origin: "source", source_stream_ids: [] }), new Set(["s1"])),
    ).toBe(false);
  });
});
