export type EntityId = string;

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: EntityId;
  name: string;
  slug: string;
  description: string;
  price: number;
  /** null clears a previously set discount on PATCH. */
  discountPrice?: number | null;
  images: string[];
  categoryId: EntityId;
  sku: string;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  createdAt?: string;
}

export interface Category {
  id: EntityId;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  parentId?: EntityId;
}

export type UserRole = 'admin' | 'customer';

export interface User {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  addresses?: ShippingAddress[];
  /** Product ids the customer saved. */
  wishlist?: EntityId[];
}

/** Stored user record; never exposed past AuthService. */
export interface UserRecord extends User {
  password: string;
}

export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  id: EntityId;
  code: string;
  type: CouponType;
  value: number;
  minPurchase: number;
  active: boolean;
  /** ISO date; absent = never expires. */
  expiresAt?: string | null;
  /** Absent = unlimited. */
  usageLimit?: number | null;
  usedCount: number;
}

export interface CartItem {
  productId: EntityId;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

/** Snapshot of product name/price at purchase time. */
export interface OrderItem {
  productId: EntityId;
  productName: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
}

export interface Order {
  id: EntityId;
  orderNumber: string;
  customerId: EntityId;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export type NewOrder = Omit<Order, 'id'>;

export interface Review {
  id: EntityId;
  productId: EntityId;
  userId: EntityId;
  userName: string;
  /** Whole number 1–5. */
  rating: number;
  comment: string;
  createdAt: string;
}

export type InventoryReason = 'sale' | 'restock' | 'adjustment' | 'return';

/** One stock movement; `change` is signed (negative = stock out). */
export interface InventoryTransaction {
  id: EntityId;
  productId: EntityId;
  productName: string;
  change: number;
  reason: InventoryReason;
  note?: string;
  createdAt: string;
}
