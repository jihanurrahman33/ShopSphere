export const LOW_STOCK_THRESHOLD = 10;

export type StockLevel = 'out' | 'low' | 'ok';

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return 'out';
  return stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';
}

/** New stock after applying a signed change, or null if it would go negative or is not a whole number. */
export function stockAfter(current: number, change: number): number | null {
  if (!Number.isInteger(change) || change === 0) return null;
  const next = current + change;
  return next < 0 ? null : next;
}
