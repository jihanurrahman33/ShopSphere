import { describe, expect, it } from 'vitest';
import { createOrder } from './order.factory';

describe('createOrder', () => {
  const draft = {
    customerId: 'u1',
    shippingAddress: { fullName: 'A', phone: '0123456789', address: 'x', city: 'Dhaka' },
    items: [{ productId: 'p1', name: 'Headphones', unitPrice: 800, quantity: 2, maxStock: 5 }],
    subtotal: 1600, shippingCost: 100, discount: 0, total: 1700,
  };

  it('snapshots product name and price and starts pending/unpaid', () => {
    const order = createOrder(draft, new Date('2026-11-03T00:00:00Z'));
    expect(order.items[0]).toEqual({ productId: 'p1', productName: 'Headphones', quantity: 2, price: 800 });
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('unpaid');
    expect(order.createdAt).toBe('2026-11-03T00:00:00.000Z');
  });
});
