import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { couponProblem } from '../../../core/domain/coupon-rules';
import { CartFacade } from '../../../core/facades/cart.facade';
import { CouponRepository } from '../../../core/repositories/repositories';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Shopping cart</h1>
    @if (cart.items().length === 0) {
      <p>Your cart is empty. <a routerLink="/store/products" class="text-violet-700 underline">Browse products</a></p>
    } @else {
      <ul class="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        @for (item of cart.items(); track item.productId) {
          <li class="flex items-center justify-between gap-4 p-4">
            <span class="font-medium">{{ item.name }}</span>
            <input type="number" min="0" [max]="item.maxStock" class="w-20 rounded-lg border border-gray-400 px-2 py-1" [attr.aria-label]="'Quantity for ' + item.name" [value]="item.quantity" (change)="cart.setQuantity(item.productId, +$any($event.target).value)" />
            <span>{{ item.unitPrice * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span>
            <button type="button" class="text-rose-700 underline" (click)="cart.remove(item.productId)">Remove</button>
          </li>
        }
      </ul>

      <form class="mt-4 flex items-end gap-2" (submit)="$event.preventDefault(); applyCoupon(code.value)">
        <label class="flex flex-col text-sm">Coupon code
          <input #code type="text" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
        <button type="submit" class="rounded-lg border border-violet-700 px-4 py-2 text-violet-800">Apply</button>
      </form>
      @if (couponMessage(); as msg) {
        <p role="status" class="mt-1 text-sm">{{ msg }}</p>
      }

      <a routerLink="/store/checkout" class="mt-6 inline-block rounded-lg bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800">Proceed to checkout</a>
      <dl class="mt-6 ml-auto max-w-xs space-y-1">
        <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ cart.subtotal() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
        <div class="flex justify-between"><dt>Discount</dt><dd>−{{ cart.discount() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
        <div class="flex justify-between"><dt>Shipping</dt><dd>{{ cart.shippingCost() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
        <div class="flex justify-between border-t pt-1 text-lg font-bold"><dt>Total</dt><dd>{{ cart.total() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
      </dl>
    }
  `,
})
export class Cart {
  protected readonly cart = inject(CartFacade);
  private readonly coupons = inject(CouponRepository);
  protected readonly couponMessage = signal('');

  protected applyCoupon(raw: string): void {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    this.coupons.findByCode(code).subscribe({
      next: ([coupon]) => {
        const problem = coupon ? couponProblem(coupon, this.cart.subtotal(), new Date()) : 'Invalid coupon code.';
        this.cart.applyCoupon(problem ? null : coupon);
        this.couponMessage.set(problem ?? `Coupon ${coupon.code} applied.`);
      },
      error: (e: Error) => this.couponMessage.set(e.message),
    });
  }
}
