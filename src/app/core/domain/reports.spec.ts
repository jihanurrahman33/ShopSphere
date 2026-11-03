import { describe, expect, it } from 'vitest';
import { Order } from '../models';
import { categorySales, dailySales, monthOverMonth, monthlySales, recentOrders, statusBreakdown, toCsv, topProducts } from './reports';

const order = (over: Partial<Order>): Order => ({
  id: '1', orderNumber: 'SS-1', customerId: 'u1',
  shippingAddress: { fullName: 'A', phone: '0123456789', address: 'x', city: 'Dhaka' },
  items: [{ productId: 'p1', productName: 'Headphones', quantity: 2, price: 100 }],
  subtotal: 200, shippingCost: 0, discount: 0, total: 200, status: 'delivered', paymentStatus: 'paid',
  createdAt: '2026-11-03T10:00:00Z', ...over,
});

describe('sales reports', () => {
  const orders = [
    order({ id: '1' }),
    order({ id: '2', total: 300, createdAt: '2026-11-03T18:00:00Z' }),
    order({ id: '3', total: 50, createdAt: '2026-10-30T10:00:00Z' }),
    order({ id: '4', total: 999, status: 'cancelled' }),
  ];

  it('groups revenue by day and month, ignoring cancelled orders', () => {
    expect(dailySales(orders)).toEqual([
      { period: '2026-10-30', orders: 1, revenue: 50 },
      { period: '2026-11-03', orders: 2, revenue: 500 },
    ]);
    expect(monthlySales(orders).map((m) => m.period)).toEqual(['2026-10', '2026-11']);
  });

  it('ranks top products by quantity', () => {
    const top = topProducts(orders, 1);
    expect(top).toEqual([{ productId: 'p1', name: 'Headphones', quantity: 6, revenue: 600 }]);
  });

  it('sums category revenue with a fallback for unknown products', () => {
    expect(categorySales(orders, new Map([['p1', 'c1']]))).toEqual([{ categoryId: 'c1', revenue: 600 }]);
    expect(categorySales(orders, new Map())[0].categoryId).toBe('unknown');
  });

  it('counts every status including cancelled', () => {
    expect(statusBreakdown(orders)).toEqual([
      { status: 'delivered', count: 3 },
      { status: 'cancelled', count: 1 },
    ]);
  });
});

describe('dashboard helpers', () => {
  const orders = [
    order({ id: '1', total: 300, createdAt: '2026-11-02T10:00:00Z' }),
    order({ id: '2', total: 200, createdAt: '2026-10-15T10:00:00Z' }),
    order({ id: '3', total: 100, createdAt: '2026-11-03T10:00:00Z' }),
  ];

  it('compares this month with last month, including across a year boundary', () => {
    expect(monthOverMonth(orders, new Date('2026-11-10T00:00:00Z'))).toEqual({ current: 400, previous: 200, changePercent: 100 });
    const january = [order({ createdAt: '2025-12-20T00:00:00Z', total: 50 })];
    expect(monthOverMonth(january, new Date('2026-01-05T00:00:00Z')).previous).toBe(50);
  });

  it('returns a null change when last month had no revenue', () => {
    expect(monthOverMonth([order({ createdAt: '2026-11-02T00:00:00Z' })], new Date('2026-11-10T00:00:00Z')).changePercent).toBeNull();
  });

  it('lists the newest orders first without mutating the input', () => {
    const ids = recentOrders(orders, 2).map((o) => o.id);
    expect(ids).toEqual(['3', '1']);
    expect(orders[0].id).toBe('1');
  });
});

describe('toCsv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"']])).toBe('a,b\r\n"x,y","say ""hi"""');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(toCsv(['n'], [['=SUM(A1)'], ['-1+1']])).toBe("n\r\n'=SUM(A1)\r\n'-1+1");
  });
});
