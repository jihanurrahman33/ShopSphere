import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap, throwError } from 'rxjs';
import { canTransition } from '../domain/order-workflow';
import { CartFacade } from '../facades/cart.facade';
import { createOrder } from '../factories/order.factory';
import { CartItem, Order, OrderStatus, Product, ShippingAddress } from '../models';
import { CouponRepository, OrderRepository, ProductRepository } from '../repositories/repositories';
import { AuthService } from './auth.service';
import { InventoryService } from './inventory.service';

/** Application service orchestrating checkout across cart, stock and orders. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly cart = inject(CartFacade);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderRepository);
  private readonly products = inject(ProductRepository);
  private readonly coupons = inject(CouponRepository);
  private readonly inventory = inject(InventoryService);

  /**
   * Re-fetches latest stock, creates the order, decrements stock, clears the cart.
   * Client-side only: a real backend must do this atomically.
   */
  placeOrder(shippingAddress: ShippingAddress): Observable<Order> {
    const user = this.auth.user();
    const items = this.cart.items();
    if (!user) return throwError(() => new Error('Please sign in to place an order.'));
    if (items.length === 0) return throwError(() => new Error('Your cart is empty.'));

    return forkJoin(items.map((i) => this.products.findById(i.productId))).pipe(
      switchMap((latest) => {
        const short = items.find((i, idx) => latest[idx].stock < i.quantity);
        if (short) return throwError(() => new Error(`Not enough stock for ${short.name}.`));

        const draft = {
          customerId: user.id,
          shippingAddress,
          items,
          subtotal: this.cart.subtotal(),
          shippingCost: this.cart.shippingCost(),
          discount: this.cart.discount(),
          total: this.cart.total(),
        };
        return this.orders.create(createOrder(draft, new Date())).pipe(
          switchMap((order) => forkJoin(this.sideEffects(items, latest)).pipe(map(() => order))),
        );
      }),
      map((order) => {
        this.cart.clear();
        return order;
      }),
    );
  }

  /** Stock decrements plus coupon usage, run in parallel after the order exists. */
  private sideEffects(items: readonly CartItem[], latest: readonly Product[]): Observable<unknown>[] {
    const stock = items.map((i, idx) => this.products.update(i.productId, { stock: latest[idx].stock - i.quantity }));
    const movements = items.map((i, idx) => this.inventory.record(latest[idx], -i.quantity, 'sale'));
    const coupon = this.cart.coupon();
    const usage = coupon ? [this.coupons.update(coupon.id, { usedCount: coupon.usedCount + 1 })] : [];
    return [...stock, ...movements, ...usage];
  }

  updateStatus(order: Order, status: OrderStatus): Observable<Order> {
    if (!canTransition(order.status, status)) {
      return throwError(() => new Error(`Cannot change ${order.status} order to ${status}.`));
    }
    const paymentStatus = status === 'cancelled' && order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
    return this.orders.update(order.id, { status, paymentStatus });
  }
}
