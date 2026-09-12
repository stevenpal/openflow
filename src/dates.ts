/**
 * Deterministic date primitives for resolving relative descriptor parameters (e.g. "7 days
 * before today"). Kept as script primitives rather than agent arithmetic because quarter
 * boundaries, leap years, and month-length edge cases are easy to get subtly wrong by hand.
 * All resolution is UTC unless the caller passes an explicit timezone offset in `anchor`.
 */

export type PeriodUnit = "day" | "week" | "month" | "quarter" | "year";

/** Returns `anchor` shifted by `offsetDays` (negative = earlier), as an ISO 8601 UTC date. */
export function getDate(anchor: string, offsetDays = 0): string {
  const base = new Date(anchor);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`invalid anchor date: "${anchor}"`);
  }
  const shifted = new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate() + offsetDays,
  ));
  return shifted.toISOString().slice(0, 10);
}

/** Returns the UTC start-of-period date containing `date` (defaults to today) for `unit`. */
export function getPeriodStart(unit: PeriodUnit, date?: string): string {
  const base = date ? new Date(date) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new Error(`invalid date: "${date}"`);
  }
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const day = base.getUTCDate();

  switch (unit) {
    case "day":
      return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
    case "week": {
      const dayOfWeek = new Date(Date.UTC(year, month, day)).getUTCDay();
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      return new Date(Date.UTC(year, month, day - daysSinceMonday)).toISOString().slice(0, 10);
    }
    case "month":
      return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    case "quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return new Date(Date.UTC(year, quarterStartMonth, 1)).toISOString().slice(0, 10);
    }
    case "year":
      return new Date(Date.UTC(year, 0, 1)).toISOString().slice(0, 10);
  }
}
