import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { couponProblem } from '../../../core/domain/coupon-rules';
import { CartFacade } from '../../../core/facades/cart.facade';
import { ShippingAddress } from '../../../core/models';
import { CouponRepository } from '../../../core/repositories/repositories';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

type PaymentMethod = 'cod' | 'shopcart' | 'paypal' | 'card';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Title & Breadcrumb -->
      <div class="border-b border-gray-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" class="mb-1 text-xs text-gray-500">
            <a routerLink="/store" class="hover:text-[#003d29]">Home</a>
            <span class="mx-1.5 text-gray-300">/</span>
            <a routerLink="/store/cart" class="hover:text-[#003d29]">Cart</a>
            <span class="mx-1.5 text-gray-300">/</span>
            <span class="font-semibold text-gray-800">Checkout</span>
          </nav>
          <h1 class="text-3xl font-black tracking-tight text-gray-900">Checkout</h1>
        </div>
        <a routerLink="/store/cart" class="text-xs font-bold text-[#003d29] hover:underline flex items-center gap-1">
          ← Return to cart
        </a>
      </div>

      @if (cart.items().length === 0) {
        <div class="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-xs">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-[#003d29]" aria-hidden="true">
            🛒
          </div>
          <h2 class="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h2>
          <p class="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Add items to your cart before proceeding to checkout.
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
          <!-- Left Column: Review Items & Delivery Information (matching 1.webp) -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Review Item And Shipping Card -->
            <section aria-labelledby="review-items-heading" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h2 id="review-items-heading" class="text-base font-extrabold text-gray-900">
                  Review Item And Shipping
                </h2>
                <a routerLink="/store/cart" class="text-xs font-bold text-[#003d29] hover:underline">
                  Edit items
                </a>
              </div>

              <ul class="divide-y divide-gray-100">
                @for (item of cart.items(); track item.productId) {
                  <li class="py-3 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl border border-gray-100" aria-hidden="true">
                        🛍️
                      </div>
                      <div>
                        <p class="font-bold text-gray-900 text-sm">
                          {{ item.name }}
                        </p>
                        <p class="text-xs text-gray-400 mt-0.5">
                          Quantity: {{ item.quantity < 10 ? '0' + item.quantity : item.quantity }}
                        </p>
                      </div>
                    </div>

                    <div class="text-right">
                      <p class="font-bold text-gray-900 text-sm">
                        {{ item.unitPrice * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                      </p>
                      <p class="text-xs text-gray-400">
                        {{ item.unitPrice | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }} each
                      </p>
                    </div>
                  </li>
                }
              </ul>
            </section>

            <!-- Delivery Information Card (Form) -->
            <section aria-labelledby="delivery-info-heading" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                <h2 id="delivery-info-heading" class="text-base font-extrabold text-gray-900">
                  Delivery Information
                </h2>
                @if (savedAddresses().length > 0) {
                  <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#003d29]">
                    {{ savedAddresses().length }} Saved
                  </span>
                }
              </div>

              <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate id="checkout-form">
                @if (savedAddresses().length > 0) {
                  <label class="flex flex-col text-xs font-bold text-gray-700">
                    Use a saved address
                    <select
                      class="mt-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:border-[#003d29] focus:outline-none"
                      (change)="useAddress($any($event.target).value)"
                    >
                      <option value="">Enter a new address</option>
                      @for (a of savedAddresses(); track $index) {
                        <option [value]="$index">{{ a.fullName }} — {{ a.address }}, {{ a.city }}</option>
                      }
                    </select>
                  </label>
                }

                @for (field of fields; track field.name) {
                  <label class="flex flex-col text-xs font-bold text-gray-700">
                    {{ field.label }}
                    <input
                      [type]="field.type"
                      [formControlName]="field.name"
                      [attr.autocomplete]="field.autocomplete"
                      [placeholder]="field.placeholder"
                      class="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#003d29] focus:bg-white focus:outline-none"
                      [attr.aria-invalid]="form.controls[field.name].touched && form.controls[field.name].invalid"
                    />
                    @if (form.controls[field.name].touched && form.controls[field.name].invalid) {
                      <span role="alert" class="mt-1 text-xs font-medium text-rose-600">{{ field.error }}</span>
                    }
                  </label>
                }

                @if (error(); as message) {
                  <p role="alert" class="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    {{ message }}
                  </p>
                }

                <div class="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    class="w-full rounded-full bg-[#003d29] py-3.5 px-6 font-bold text-sm text-white shadow-md hover:bg-[#002e1f] transition disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                    [disabled]="busy()"
                  >
                    {{ busy() ? 'Placing order…' : 'Confirm & Place Order' }}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <!-- Right Column: Order Summary & Payment Details (matching 1.webp) -->
          <div class="lg:col-span-5 space-y-6">
            <!-- Order Summary Card -->
            <aside aria-label="Order summary" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-5">
              <h2 class="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              <!-- Coupon Code Input -->
              <div>
                <label for="checkout-coupon" class="block text-xs font-bold text-gray-700 mb-1.5">Enter Coupon Code</label>
                <div class="flex gap-2">
                  <input
                    id="checkout-coupon"
                    #couponInput
                    type="text"
                    placeholder="e.g. WELCOME10"
                    class="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold uppercase text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    class="rounded-full bg-[#003d29] px-5 py-2 text-xs font-bold text-white hover:bg-[#002e1f] transition"
                    (click)="applyCoupon(couponInput.value)"
                  >
                    Apply Coupon
                  </button>
                </div>
                @if (couponMessage(); as msg) {
                  <p role="status" class="mt-2 text-xs font-semibold" [class.text-emerald-700]="!msg.includes('Invalid')" [class.text-rose-600]="msg.includes('Invalid')">
                    {{ msg }}
                  </p>
                }
              </div>

              <!-- Price Breakdown -->
              <dl class="space-y-3 text-xs border-t border-gray-100 pt-4">
                <div class="flex justify-between text-gray-600">
                  <dt>Subtotal ({{ cart.count() }} items)</dt>
                  <dd class="font-bold text-gray-900">{{ cart.subtotal() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Coupon Discount</dt>
                  <dd class="font-bold text-emerald-700">−{{ cart.discount() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Shipping Cost</dt>
                  <dd class="font-bold text-gray-900">
                    {{ cart.shippingCost() === 0 ? 'FREE' : (cart.shippingCost() | currency: 'BDT' : 'symbol-narrow' : '1.0-0') }}
                  </dd>
                </div>
                <div class="flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-gray-900">
                  <dt>Total Amount</dt>
                  <dd class="text-xl text-[#003d29]">{{ cart.total() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
              </dl>
            </aside>

            <!-- Payment Details Card (matching 1.webp) -->
            <section aria-labelledby="payment-details-heading" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <h2 id="payment-details-heading" class="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                Payment Details
              </h2>

              <div class="space-y-2.5" role="radiogroup" aria-label="Payment method">
                <!-- Cash on Delivery -->
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="payment() === 'cod'"
                  (click)="payment.set('cod')"
                  class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition"
                  [class.border-[#003d29]]="payment() === 'cod'"
                  [class.bg-emerald-50/50]="payment() === 'cod'"
                  [class.border-gray-200]="payment() !== 'cod'"
                >
                  <div class="flex items-center gap-3">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full border-2" [class.border-[#003d29]]="payment() === 'cod'" [class.border-gray-400]="payment() !== 'cod'">
                      @if (payment() === 'cod') {
                        <span class="h-2.5 w-2.5 rounded-full bg-[#003d29]"></span>
                      }
                    </span>
                    <span class="text-xs font-bold text-gray-900">Cash on Delivery</span>
                  </div>
                  <span class="text-xs text-gray-400 font-medium">Pay upon receipt</span>
                </button>

                <!-- Shopcart Card -->
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="payment() === 'shopcart'"
                  (click)="payment.set('shopcart')"
                  class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition"
                  [class.border-[#003d29]]="payment() === 'shopcart'"
                  [class.bg-emerald-50/50]="payment() === 'shopcart'"
                  [class.border-gray-200]="payment() !== 'shopcart'"
                >
                  <div class="flex items-center gap-3">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full border-2" [class.border-[#003d29]]="payment() === 'shopcart'" [class.border-gray-400]="payment() !== 'shopcart'">
                      @if (payment() === 'shopcart') {
                        <span class="h-2.5 w-2.5 rounded-full bg-[#003d29]"></span>
                      }
                    </span>
                    <span class="text-xs font-bold text-gray-900">Shopcart Card</span>
                  </div>
                  <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">5% Cashback</span>
                </button>

                <!-- Paypal -->
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="payment() === 'paypal'"
                  (click)="payment.set('paypal')"
                  class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition"
                  [class.border-[#003d29]]="payment() === 'paypal'"
                  [class.bg-emerald-50/50]="payment() === 'paypal'"
                  [class.border-gray-200]="payment() !== 'paypal'"
                >
                  <div class="flex items-center gap-3">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full border-2" [class.border-[#003d29]]="payment() === 'paypal'" [class.border-gray-400]="payment() !== 'paypal'">
                      @if (payment() === 'paypal') {
                        <span class="h-2.5 w-2.5 rounded-full bg-[#003d29]"></span>
                      }
                    </span>
                    <span class="text-xs font-bold text-gray-900">PayPal</span>
                  </div>
                  <span class="text-xs text-blue-700 font-bold">PayPal</span>
                </button>

                <!-- Credit or Debit Card -->
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="payment() === 'card'"
                  (click)="payment.set('card')"
                  class="w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition"
                  [class.border-[#003d29]]="payment() === 'card'"
                  [class.bg-emerald-50/50]="payment() === 'card'"
                  [class.border-gray-200]="payment() !== 'card'"
                >
                  <div class="flex items-center gap-3">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full border-2" [class.border-[#003d29]]="payment() === 'card'" [class.border-gray-400]="payment() !== 'card'">
                      @if (payment() === 'card') {
                        <span class="h-2.5 w-2.5 rounded-full bg-[#003d29]"></span>
                      }
                    </span>
                    <span class="text-xs font-bold text-gray-900">Credit or Debit Card</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-gray-500 font-bold" aria-hidden="true">
                    <span>💳 Visa / MC</span>
                  </div>
                </button>
              </div>

              <!-- Simulated Card Fields when 'card' is selected -->
              @if (payment() === 'card') {
                <div class="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-200 space-y-3">
                  <p class="text-xs font-bold text-gray-700">Card Information (Simulated)</p>
                  <div>
                    <label for="card-holder" class="block text-[11px] font-semibold text-gray-600 mb-1">Cardholder Name</label>
                    <input id="card-holder" type="text" placeholder="John Doe" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#003d29] focus:outline-none" />
                  </div>
                  <div>
                    <label for="card-number" class="block text-[11px] font-semibold text-gray-600 mb-1">Card Number</label>
                    <input id="card-number" type="text" placeholder="4242 •••• •••• 4242" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#003d29] focus:outline-none" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label for="card-exp" class="block text-[11px] font-semibold text-gray-600 mb-1">Expiry Date</label>
                      <input id="card-exp" type="text" placeholder="MM/YY" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#003d29] focus:outline-none" />
                    </div>
                    <div>
                      <label for="card-cvc" class="block text-[11px] font-semibold text-gray-600 mb-1">CVC</label>
                      <input id="card-cvc" type="text" placeholder="123" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#003d29] focus:outline-none" />
                    </div>
                  </div>
                </div>
              }

              <!-- Security notice -->
              <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span class="flex items-center gap-1 font-semibold text-gray-500">🔒 SSL Encrypted</span>
                <span>Guaranteed Safe Checkout</span>
              </div>
            </section>
          </div>
        </div>
      }
    </div>
  `,
})
export class Checkout {
  protected readonly cart = inject(CartFacade);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly couponRepo = inject(CouponRepository);

  protected readonly payment = signal<PaymentMethod>('cod');
  protected readonly couponMessage = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
  });

  protected readonly fields = [
    { name: 'fullName', label: 'Full name', type: 'text', autocomplete: 'name', placeholder: 'Enter your full name', error: 'Full name is required.' },
    { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel', placeholder: '+8801712345678', error: 'Enter a valid phone number (10–14 digits).' },
    { name: 'address', label: 'Address', type: 'text', autocomplete: 'street-address', placeholder: 'House, road, street address', error: 'Address is required.' },
    { name: 'city', label: 'City', type: 'text', autocomplete: 'address-level2', placeholder: 'e.g. Dhaka', error: 'City is required.' },
  ] as const;

  protected readonly savedAddresses = computed<readonly ShippingAddress[]>(() => this.auth.user()?.addresses ?? []);

  protected useAddress(index: string): void {
    const address = this.savedAddresses()[Number(index)];
    if (index !== '' && address) this.form.patchValue(address);
  }

  protected applyCoupon(raw: string): void {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    this.couponRepo.findByCode(code).subscribe({
      next: ([coupon]) => {
        const problem = coupon ? couponProblem(coupon, this.cart.subtotal(), new Date()) : 'Invalid coupon code.';
        this.cart.applyCoupon(problem ? null : coupon);
        this.couponMessage.set(problem ?? `Coupon ${coupon.code} applied.`);
      },
      error: (e: Error) => this.couponMessage.set(e.message),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.orders.placeOrder(this.form.getRawValue()).subscribe({
      next: (order) => void this.router.navigate(['/store/orders'], { queryParams: { placed: order.orderNumber } }),
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
