import { describe, it, expect } from "vitest";
import { validateEntrySchema } from "../src/ledger/schema.js";

const minimalValid = {
  id: "stream-1",
  descriptor: "GET /api/foo",
  type: "chat",
  origin: "source",
  source_stream_ids: [],
  syncable: true,
  description: "A test stream",
  intents: [],
  added_at: "2026-01-01T00:00:00.000Z",
  last_synced_at: null,
};

describe("ledger entry schema", () => {
  it("accepts a minimal valid entry", () => {
    const result = validateEntrySchema(minimalValid);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a missing required field", () => {
    const { descriptor: _descriptor, ...withoutDescriptor } = minimalValid;
    const result = validateEntrySchema(withoutDescriptor);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("descriptor"))).toBe(true);
  });

  it("rejects an invalid type enum value", () => {
    const result = validateEntrySchema({ ...minimalValid, type: "not-a-shape" });
    expect(result.ok).toBe(false);
  });
});
