export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING_COST = 100;

export interface ShippingStrategy {
  cost(subtotal: number): number;
}

export class StandardShipping implements ShippingStrategy {
  cost(subtotal: number): number {
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  }
}
