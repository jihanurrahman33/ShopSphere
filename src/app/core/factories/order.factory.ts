import { CartItem, NewOrder, ShippingAddress } from '../models';

export interface OrderDraft {
  customerId: string;
  shippingAddress: ShippingAddress;
  items: readonly CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
}

/** Factory pattern: builds a consistent order, snapshotting product name and price. */
export function createOrder(draft: OrderDraft, now: Date): NewOrder {
  return {
    orderNumber: `SS-${now.getTime()}`,
    customerId: draft.customerId,
    shippingAddress: draft.shippingAddress,
    items: draft.items.map((i) => ({
      productId: i.productId,
      productName: i.name,
      quantity: i.quantity,
      price: i.unitPrice,
    })),
    subtotal: draft.subtotal,
    shippingCost: draft.shippingCost,
    discount: draft.discount,
    total: draft.total,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: now.toISOString(),
  };
}
