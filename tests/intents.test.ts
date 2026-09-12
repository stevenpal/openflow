import { describe, it, expect } from "vitest";
import { applyIntentOperation, IntentOperationError } from "../src/ledger/intents.js";

describe("applyIntentOperation", () => {
  it("sharpens an existing intent in place", () => {
    const result = applyIntentOperation(["customer conversation about pricing"], {
      kind: "sharpen",
      match: "customer conversation about pricing",
      replacement: "Acme Corp asked for a 20% discount on the annual plan",
    });
    expect(result).toEqual(["Acme Corp asked for a 20% discount on the annual plan"]);
  });

  it("adds a new, distinct intent alongside existing ones", () => {
    const result = applyIntentOperation(["intent A"], { kind: "add", text: "intent B" });
    expect(result).toEqual(["intent A", "intent B"]);
  });

  it("drops a stale intent", () => {
    const result = applyIntentOperation(["intent A", "intent B"], { kind: "drop", match: "intent A" });
    expect(result).toEqual(["intent B"]);
  });

  it("throws when sharpening or dropping a non-matching intent", () => {
    expect(() => applyIntentOperation(["intent A"], { kind: "sharpen", match: "missing", replacement: "x" })).toThrow(
      IntentOperationError,
    );
    expect(() => applyIntentOperation(["intent A"], { kind: "drop", match: "missing" })).toThrow(
      IntentOperationError,
    );
  });
});
