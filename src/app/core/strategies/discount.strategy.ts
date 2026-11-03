import { Coupon } from '../models';

/** Strategy pattern: each coupon type is an interchangeable discount algorithm. */
export interface DiscountStrategy {
  calculate(subtotal: number): number;
}

export class NoDiscount implements DiscountStrategy {
  calculate(): number {
    return 0;
  }
}

export class PercentageDiscount implements DiscountStrategy {
  constructor(private readonly percent: number) {}

  calculate(subtotal: number): number {
    return Math.min(subtotal, Math.round((subtotal * this.percent) / 100));
  }
}

export class FixedDiscount implements DiscountStrategy {
  constructor(private readonly amount: number) {}

  calculate(subtotal: number): number {
    return Math.min(subtotal, this.amount);
  }
}

/** Factory: picks the strategy; adding a coupon type does not touch callers. */
export function discountStrategyFor(coupon: Coupon | null, subtotal: number): DiscountStrategy {
  if (!coupon || !coupon.active || subtotal < coupon.minPurchase) {
    return new NoDiscount();
  }
  return coupon.type === 'percentage' ? new PercentageDiscount(coupon.value) : new FixedDiscount(coupon.value);
}
