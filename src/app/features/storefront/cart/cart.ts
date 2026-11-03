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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Title -->
      <div class="border-b border-gray-100 pb-5">
        <h1 class="text-3xl font-black tracking-tight text-gray-900">Shopping Cart</h1>
        <p class="mt-1 text-sm text-gray-500">
          Review your chosen items, apply promotional codes, and calculate delivery
        </p>
      </div>

      @if (cart.items().length === 0) {
        <div class="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-xs">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-[#003d29]" aria-hidden="true">
            🛒
          </div>
          <h2 class="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h2>
          <p class="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet. Discover great gadgets, fashion, and audio.
          </p>
          <div class="mt-8">
            <a
              routerLink="/store/products"
              class="inline-flex items-center justify-center rounded-full bg-[#003d29] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#002e1f] transition"
            >
              Browse products
            </a>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left Column: Item List -->
          <div class="lg:col-span-8 space-y-4">
            <div class="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
              <div class="border-b border-gray-100 bg-gray-50/60 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500 flex justify-between">
                <span>Product</span>
                <span>Subtotal</span>
              </div>

              <ul class="divide-y divide-gray-100">
                @for (item of cart.items(); track item.productId) {
                  <li class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                    <!-- Product Info -->
                    <div class="flex items-center gap-4">
                      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f5f6f8] text-2xl" aria-hidden="true">
                        🛍️
                      </div>
                      <div>
                        <p class="font-bold text-gray-900 text-base">
                          <a [routerLink]="['/store/products', item.productId]" class="hover:text-[#003d29] hover:underline">
                            {{ item.name }}
                          </a>
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          Unit price: {{ item.unitPrice | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                        </p>
                        <button
                          type="button"
                          class="mt-2 text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                          (click)="cart.remove(item.productId)"
                        >
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <!-- Quantity & Price -->
                    <div class="flex items-center justify-between sm:justify-end gap-6">
                      <div class="flex items-center gap-2">
                        <label [for]="'qty-' + item.productId" class="sr-only">Quantity for {{ item.name }}</label>
                        <input
                          [id]="'qty-' + item.productId"
                          type="number"
                          min="0"
                          [max]="item.maxStock"
                          class="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-sm font-bold text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
                          [attr.aria-label]="'Quantity for ' + item.name"
                          [value]="item.quantity"
                          (change)="cart.setQuantity(item.productId, +$any($event.target).value)"
                        />
                      </div>

                      <span class="font-black text-gray-900 text-base sm:w-28 text-right">
                        {{ item.unitPrice * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                      </span>
                    </div>
                  </li>
                }
              </ul>
            </div>

            <!-- Coupon Code Section -->
            <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
              <h2 class="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Have a Promotional Coupon?</h2>
              <form class="flex flex-col sm:flex-row gap-3" (submit)="$event.preventDefault(); applyCoupon(code.value)">
                <div class="relative flex-1">
                  <input
                    #code
                    type="text"
                    placeholder="Enter coupon code (e.g. WELCOME10)"
                    aria-label="Coupon code"
                    class="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#003d29] focus:bg-white focus:outline-none uppercase font-bold"
                  />
                </div>
                <button
                  type="submit"
                  class="rounded-full border-2 border-[#003d29] px-6 py-2.5 text-xs font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition"
                >
                  Apply
                </button>
              </form>

              @if (couponMessage(); as msg) {
                <p role="status" class="mt-2 text-xs font-semibold" [class.text-emerald-700]="!msg.includes('Invalid')" [class.text-rose-600]="msg.includes('Invalid')">
                  {{ msg }}
                </p>
              }
            </div>
          </div>

          <!-- Right Column: Order Summary (AURORA / Shopcart aesthetic) -->
          <div class="lg:col-span-4">
            <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-5 sticky top-24">
              <h2 class="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              <dl class="space-y-3 text-sm">
                <div class="flex justify-between text-gray-600">
                  <dt>Subtotal ({{ cart.count() }} items)</dt>
                  <dd class="font-bold text-gray-900">{{ cart.subtotal() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Coupon Discount</dt>
                  <dd class="font-bold text-emerald-700">−{{ cart.discount() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Estimated Delivery</dt>
                  <dd class="font-bold text-gray-900">
                    {{ cart.shippingCost() === 0 ? 'FREE' : (cart.shippingCost() | currency: 'BDT' : 'symbol-narrow' : '1.0-0') }}
                  </dd>
                </div>
                <div class="flex justify-between border-t border-gray-100 pt-4 text-base font-black text-gray-900">
                  <dt>Estimated Total</dt>
                  <dd class="text-xl text-[#003d29]">{{ cart.total() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
              </dl>

              <div class="pt-2">
                <a
                  routerLink="/store/checkout"
                  class="block w-full text-center rounded-full bg-[#003d29] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#002e1f] transition"
                >
                  Proceed to checkout
                </a>
              </div>

              <!-- Secure Checkout Badges -->
              <div class="pt-2 text-center text-xs text-gray-400 space-y-1">
                <p class="font-semibold text-gray-500">🔒 100% Encrypted & Safe Checkout</p>
                <p>30-Day Money-Back Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
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
