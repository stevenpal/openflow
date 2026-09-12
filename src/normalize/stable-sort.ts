/**
 * Stable-sorts an order-insensitive list by a derived key, so renderers produce the same output
 * regardless of the order a source API happened to return items in (Array.prototype.sort is
 * already stable per spec, but this documents the intent at call sites).
 */
export function stableSortBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}
