import { describe, expect, it } from 'vitest';
import { Coupon } from '../models';
import { discountStrategyFor } from './discount.strategy';
import { StandardShipping } from './shipping.strategy';

const coupon = (over: Partial<Coupon>): Coupon => ({
  id: '1', code: 'X', type: 'percentage', value: 10, minPurchase: 1000, active: true, usedCount: 0, ...over,
});

describe('discountStrategyFor', () => {
  it('applies a percentage discount', () => {
    expect(discountStrategyFor(coupon({}), 2000).calculate(2000)).toBe(200);
  });

  it('applies a fixed discount capped at the subtotal', () => {
    expect(discountStrategyFor(coupon({ type: 'fixed', value: 5000, minPurchase: 0 }), 2000).calculate(2000)).toBe(2000);
  });

  it('returns no discount below the minimum purchase', () => {
    expect(discountStrategyFor(coupon({}), 500).calculate(500)).toBe(0);
  });

  it('returns no discount for an inactive or missing coupon', () => {
    expect(discountStrategyFor(coupon({ active: false }), 2000).calculate(2000)).toBe(0);
    expect(discountStrategyFor(null, 2000).calculate(2000)).toBe(0);
  });
});

describe('StandardShipping', () => {
  const shipping = new StandardShipping();

  it('is free for an empty cart and above the threshold', () => {
    expect(shipping.cost(0)).toBe(0);
    expect(shipping.cost(5000)).toBe(0);
  });

  it('charges the standard rate below the threshold', () => {
    expect(shipping.cost(999)).toBe(100);
  });
});
