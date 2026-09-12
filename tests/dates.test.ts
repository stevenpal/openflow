import { describe, it, expect } from "vitest";
import { getDate, getPeriodStart } from "../src/dates.js";

describe("getDate", () => {
  it("resolves a relative offset from an explicit anchor consistently regardless of when it runs", () => {
    // A descriptor recorded as "7 days before today" is replayed on two different days by
    // passing each day's actual date as the anchor — the primitive itself must be pure/deterministic.
    expect(getDate("2026-03-10", -7)).toBe("2026-03-03");
    expect(getDate("2026-06-10", -7)).toBe("2026-06-03");
  });

  it("handles month and year boundaries", () => {
    expect(getDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(getDate("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles leap years", () => {
    expect(getDate("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("getPeriodStart", () => {
  it("resolves quarter start across quarter boundaries", () => {
    expect(getPeriodStart("quarter", "2026-02-15")).toBe("2026-01-01");
    expect(getPeriodStart("quarter", "2026-04-01")).toBe("2026-04-01");
    expect(getPeriodStart("quarter", "2026-12-31")).toBe("2026-10-01");
  });

  it("resolves week start as the preceding Monday", () => {
    // 2026-03-11 is a Wednesday.
    expect(getPeriodStart("week", "2026-03-11")).toBe("2026-03-09");
  });

  it("resolves month and year start", () => {
    expect(getPeriodStart("month", "2026-03-11")).toBe("2026-03-01");
    expect(getPeriodStart("year", "2026-03-11")).toBe("2026-01-01");
  });
});
