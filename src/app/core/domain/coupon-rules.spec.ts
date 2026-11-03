import { describe, expect, it } from 'vitest';
import { Coupon } from '../models';
import { couponProblem } from './coupon-rules';

const NOW = new Date('2026-11-03T00:00:00Z');
const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: '1', code: 'X', type: 'percentage', value: 10, minPurchase: 1000, active: true, usedCount: 0, ...over,
});

describe('couponProblem', () => {
  it('accepts a valid coupon', () => {
    expect(couponProblem(coupon(), 2000, NOW)).toBeNull();
  });

  it('rejects inactive, expired, exhausted and under-minimum cases', () => {
    expect(couponProblem(coupon({ active: false }), 2000, NOW)).toMatch(/inactive/);
    expect(couponProblem(coupon({ expiresAt: '2026-11-02T00:00:00Z' }), 2000, NOW)).toMatch(/expired/);
    expect(couponProblem(coupon({ usageLimit: 5, usedCount: 5 }), 2000, NOW)).toMatch(/usage limit/);
    expect(couponProblem(coupon(), 500, NOW)).toMatch(/at least 1000/);
  });

  it('treats null expiry and limit as unlimited', () => {
    expect(couponProblem(coupon({ expiresAt: null, usageLimit: null, usedCount: 99 }), 2000, NOW)).toBeNull();
  });
});
