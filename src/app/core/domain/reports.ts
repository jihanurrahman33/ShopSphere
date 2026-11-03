import { Order, OrderStatus } from '../models';

export interface PeriodSales {
  readonly period: string;
  readonly orders: number;
  readonly revenue: number;
}

export interface ProductSales {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly revenue: number;
}

export interface CategorySales {
  readonly categoryId: string;
  readonly revenue: number;
}

/** Cancelled and returned orders do not produce revenue. */
export function isRevenueOrder(order: Order): boolean {
  return order.status !== 'cancelled' && order.status !== 'returned';
}

function groupSales(orders: readonly Order[], keyLength: number): PeriodSales[] {
  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (const order of orders.filter(isRevenueOrder)) {
    const key = order.createdAt.slice(0, keyLength);
    const bucket = buckets.get(key) ?? { orders: 0, revenue: 0 };
    buckets.set(key, { orders: bucket.orders + 1, revenue: bucket.revenue + order.total });
  }
  return [...buckets.entries()]
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/** Sales per day (YYYY-MM-DD, UTC), oldest first. */
export const dailySales = (orders: readonly Order[]): PeriodSales[] => groupSales(orders, 10);

/** Sales per month (YYYY-MM, UTC), oldest first. */
export const monthlySales = (orders: readonly Order[]): PeriodSales[] => groupSales(orders, 7);

export function topProducts(orders: readonly Order[], limit: number): ProductSales[] {
  const totals = new Map<string, ProductSales>();
  for (const order of orders.filter(isRevenueOrder)) {
    for (const item of order.items) {
      const prev = totals.get(item.productId);
      totals.set(item.productId, {
        productId: item.productId,
        name: item.productName,
        quantity: (prev?.quantity ?? 0) + item.quantity,
        revenue: (prev?.revenue ?? 0) + item.price * item.quantity,
      });
    }
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

/** Revenue per category, using each product's current category. Unknown products go under 'unknown'. */
export function categorySales(orders: readonly Order[], categoryOf: ReadonlyMap<string, string>): CategorySales[] {
  const totals = new Map<string, number>();
  for (const order of orders.filter(isRevenueOrder)) {
    for (const item of order.items) {
      const category = categoryOf.get(item.productId) ?? 'unknown';
      totals.set(category, (totals.get(category) ?? 0) + item.price * item.quantity);
    }
  }
  return [...totals.entries()].map(([categoryId, revenue]) => ({ categoryId, revenue })).sort((a, b) => b.revenue - a.revenue);
}

export function statusBreakdown(orders: readonly Order[]): { status: OrderStatus; count: number }[] {
  const counts = new Map<OrderStatus, number>();
  for (const order of orders) counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  return [...counts.entries()].map(([status, count]) => ({ status, count }));
}

/**
 * RFC 4180 CSV. Cells starting with = + - @ are prefixed with ' so spreadsheets
 * do not treat user-controlled text (e.g. product names) as formulas.
 */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  const cell = (value: string | number): string => {
    const text = typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}
