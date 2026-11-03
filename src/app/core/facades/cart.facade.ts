import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Coupon, Product } from '../models';
import { StorageService } from '../services/storage.service';
import { discountStrategyFor } from '../strategies/discount.strategy';
import { ShippingStrategy, StandardShipping } from '../strategies/shipping.strategy';

const CART_KEY = 'shopsphere.cart';
export const SHIPPING_STRATEGY = new StandardShipping();

/**
 * Facade pattern: one simple API for cart state, pricing and persistence.
 * Observer pattern: components react to the exposed signals.
 * State is immutable: every change replaces the items array.
 */
@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly storage = inject(StorageService);
  private readonly shipping: ShippingStrategy = SHIPPING_STRATEGY;

  private readonly _items = signal<readonly CartItem[]>(this.storage.read<CartItem[]>(CART_KEY, []));
  private readonly _coupon = signal<Coupon | null>(null);

  readonly items = this._items.asReadonly();
  readonly coupon = this._coupon.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
  readonly discount = computed(() => discountStrategyFor(this._coupon(), this.subtotal()).calculate(this.subtotal()));
  readonly shippingCost = computed(() => this.shipping.cost(this.subtotal()));
  readonly total = computed(() => this.subtotal() - this.discount() + this.shippingCost());

  constructor() {
    effect(() => this.storage.write(CART_KEY, this._items()));
  }

  add(product: Product, quantity = 1): void {
    const unitPrice = product.discountPrice ?? product.price;
    this._items.update((items) => {
      const existing = items.find((i) => i.productId === product.id);
      if (!existing) {
        return [
          ...items,
          { productId: product.id, name: product.name, unitPrice, quantity: Math.min(quantity, product.stock), maxStock: product.stock },
        ];
      }
      return items.map((i) =>
        i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock) } : i,
      );
    });
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i)),
    );
  }

  remove(productId: string): void {
    this._items.update((items) => items.filter((i) => i.productId !== productId));
  }

  applyCoupon(coupon: Coupon | null): void {
    this._coupon.set(coupon);
  }

  clear(): void {
    this._items.set([]);
    this._coupon.set(null);
  }
}
