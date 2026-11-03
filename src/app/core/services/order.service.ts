import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defaultIfEmpty, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { checkoutIssue } from '../domain/checkout-rules';
import { canTransition, restocksInventory } from '../domain/order-workflow';
import { CartFacade } from '../facades/cart.facade';
import { createOrder } from '../factories/order.factory';
import { CartItem, Coupon, Order, OrderStatus, Product, ShippingAddress } from '../models';
import { CouponRepository, OrderRepository, ProductRepository } from '../repositories/repositories';
import { AuthService } from './auth.service';
import { InventoryService } from './inventory.service';

/**
 * Application service orchestrating checkout and order status changes.
 * Client-side only: a real backend must do these steps atomically and re-price on the server.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly cart = inject(CartFacade);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderRepository);
  private readonly products = inject(ProductRepository);
  private readonly coupons = inject(CouponRepository);
  private readonly inventory = inject(InventoryService);

  /**
   * Re-fetches the latest products and coupon, refuses stale carts (unpublished product, changed
   * price, low stock, invalid coupon), then creates the order, updates stock and clears the cart.
   */
  placeOrder(shippingAddress: ShippingAddress): Observable<Order> {
    const user = this.auth.user();
    const items = this.cart.items();
    if (!user) return throwError(() => new Error('Please sign in to place an order.'));
    if (items.length === 0) return throwError(() => new Error('Your cart is empty.'));

    const cartCoupon = this.cart.coupon();
    return forkJoin({
      latest: forkJoin(items.map((i) => this.products.findById(i.productId))),
      coupon: cartCoupon ? this.coupons.findById(cartCoupon.id) : of(null),
    }).pipe(
      switchMap(({ latest, coupon }) => {
        const issue = checkoutIssue(items, latest, coupon, this.cart.subtotal(), new Date());
        if (issue) {
          if (issue.kind === 'price') this.cart.sync(latest);
          if (issue.kind === 'coupon') this.cart.applyCoupon(null);
          return throwError(() => new Error(issue.message));
        }

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
          switchMap((order) => forkJoin(this.sideEffects(items, latest, coupon)).pipe(map(() => order))),
        );
      }),
      map((order) => {
        this.cart.clear();
        return order;
      }),
    );
  }

  /** Stock decrements, ledger entries and coupon usage, run in parallel after the order exists. */
  private sideEffects(items: readonly CartItem[], latest: readonly Product[], coupon: Coupon | null): Observable<unknown>[] {
    const stock = items.map((i, idx) => this.products.update(i.productId, { stock: latest[idx].stock - i.quantity }));
    const movements = items.map((i, idx) => this.inventory.record(latest[idx], -i.quantity, 'sale'));
    const usage = coupon ? [this.coupons.update(coupon.id, { usedCount: coupon.usedCount + 1 })] : [];
    return [...stock, ...movements, ...usage];
  }

  /** Applies a legal status change; cancelling or returning also restocks the items. */
  updateStatus(order: Order, status: OrderStatus): Observable<Order> {
    if (!canTransition(order.status, status)) {
      return throwError(() => new Error(`Cannot change ${order.status} order to ${status}.`));
    }
    const paymentStatus = status === 'cancelled' && order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
    return this.orders.update(order.id, { status, paymentStatus }).pipe(
      switchMap((updated) => (restocksInventory(status) ? this.restock(order).pipe(map(() => updated)) : of(updated))),
    );
  }

  private restock(order: Order): Observable<unknown> {
    return forkJoin(
      order.items.map((item) =>
        this.products.findById(item.productId).pipe(
          switchMap((product) => this.inventory.adjust(product, item.quantity, 'return', `Order ${order.orderNumber}`)),
          // The product may have been deleted since the order; there is nothing to restock then.
          catchError(() => of(null)),
        ),
      ),
    ).pipe(defaultIfEmpty([]));
  }
}
