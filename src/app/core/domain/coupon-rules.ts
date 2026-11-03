import { Coupon } from '../models';

/** Returns why a coupon cannot be used right now, or null if it can. Pure: `now` is injected. */
export function couponProblem(coupon: Coupon, subtotal: number, now: Date): string | null {
  if (!coupon.active) return 'This coupon is inactive.';
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime()) return 'This coupon has expired.';
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return 'This coupon has reached its usage limit.';
  if (subtotal < coupon.minPurchase) return `Spend at least ${coupon.minPurchase} to use this coupon.`;
  return null;
}
