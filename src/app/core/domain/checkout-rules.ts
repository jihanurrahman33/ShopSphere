import { CartItem, Coupon, Product } from '../models';
import { couponProblem } from './coupon-rules';

export type CheckoutIssueKind = 'unavailable' | 'price' | 'stock' | 'coupon';

export interface CheckoutIssue {
  readonly kind: CheckoutIssueKind;
  readonly message: string;
}

const currentPrice = (product: Product): number => product.discountPrice ?? product.price;

/**
 * Compares the cart with the latest catalog data (same order as `items`) and returns the first
 * reason the order cannot be placed as-is, or null. Pure: `now` is injected.
 */
export function checkoutIssue(
  items: readonly CartItem[],
  latest: readonly Product[],
  coupon: Coupon | null,
  subtotal: number,
  now: Date,
): CheckoutIssue | null {
  const unavailable = items.find((_, i) => latest[i].status !== 'active');
  if (unavailable) {
    return { kind: 'unavailable', message: `${unavailable.name} is no longer available. Please remove it from your cart.` };
  }
  if (items.some((item, i) => item.unitPrice !== currentPrice(latest[i]))) {
    return { kind: 'price', message: 'Some prices changed. Your cart was updated; please review it and try again.' };
  }
  const short = items.find((item, i) => latest[i].stock < item.quantity);
  if (short) return { kind: 'stock', message: `Not enough stock for ${short.name}.` };

  const problem = coupon ? couponProblem(coupon, subtotal, now) : null;
  return problem ? { kind: 'coupon', message: `${problem} The coupon was removed from your cart.` } : null;
}
