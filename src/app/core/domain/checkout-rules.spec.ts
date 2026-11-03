import { describe, expect, it } from 'vitest';
import { CartItem, Coupon, Product } from '../models';
import { checkoutIssue } from './checkout-rules';

const NOW = new Date('2026-11-03T00:00:00Z');
const item: CartItem = { productId: 'p1', name: 'Headphones', unitPrice: 1000, quantity: 2, maxStock: 5 };
const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1', name: 'Headphones', slug: 'h', description: '', price: 1000, images: [], categoryId: '1',
  sku: 'S', stock: 5, status: 'active', featured: false, ...over,
});
const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: 'c1', code: 'X', type: 'percentage', value: 10, minPurchase: 0, active: true, usedCount: 0, ...over,
});

describe('checkoutIssue', () => {
  it('returns null when everything is current', () => {
    expect(checkoutIssue([item], [product()], coupon(), 2000, NOW)).toBeNull();
  });

  it('flags unpublished products first', () => {
    expect(checkoutIssue([item], [product({ status: 'draft', price: 1 })], null, 2000, NOW)?.kind).toBe('unavailable');
  });

  it('flags a changed price, including a new discount', () => {
    expect(checkoutIssue([item], [product({ price: 1200 })], null, 2000, NOW)?.kind).toBe('price');
    expect(checkoutIssue([item], [product({ discountPrice: 900 })], null, 2000, NOW)?.kind).toBe('price');
  });

  it('flags insufficient stock', () => {
    expect(checkoutIssue([item], [product({ stock: 1 })], null, 2000, NOW)?.kind).toBe('stock');
  });

  it('flags a coupon that is no longer valid', () => {
    expect(checkoutIssue([item], [product()], coupon({ usageLimit: 1, usedCount: 1 }), 2000, NOW)?.kind).toBe('coupon');
    expect(checkoutIssue([item], [product()], coupon({ expiresAt: '2026-11-01T00:00:00Z' }), 2000, NOW)?.kind).toBe('coupon');
  });
});
