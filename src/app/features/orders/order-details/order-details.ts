import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { OrderRepository } from '../../../core/repositories/repositories';
import { AuthService } from '../../../core/services/auth.service';
import { OrderTimeline } from '../../../shared/components/order-timeline/order-timeline';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

/**
 * Shared by /store/orders/:id and /admin/orders/:id.
 * `id` comes from the route param, `backLink` from route data (withComponentInputBinding).
 * The ownership check is a UX guard only; a real backend must authorise per order.
 */
@Component({
  selector: 'app-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, OrderTimeline, StatusBadge],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <a [routerLink]="backLink()" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#003d29] hover:underline print:hidden">
        ← Back to orders
      </a>

      @if (order.isLoading()) {
        <p role="status" class="mt-4 text-sm text-gray-500 animate-pulse">Loading order details…</p>
      } @else if (order.error() || !allowed()) {
        <p role="alert" class="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {{ order.error()?.message ?? 'Order not found.' }}
        </p>
      } @else if (order.value(); as o) {
        <article class="space-y-6">
          <header class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Order Overview</span>
              <h1 class="text-3xl font-black tracking-tight text-gray-900">Order {{ o.orderNumber }}</h1>
              <p class="text-xs text-gray-500 mt-1">Placed on {{ o.createdAt | date: 'medium' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <app-status-badge [status]="o.status" />
              <app-status-badge [status]="o.paymentStatus" />
              <button
                type="button"
                class="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 print:hidden cursor-pointer"
                (click)="print()"
              >
                🖨️ Print invoice
              </button>
            </div>
          </header>

          <section aria-labelledby="track-h" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs print:hidden">
            <h2 id="track-h" class="text-base font-extrabold text-gray-900 mb-4">Tracking</h2>
            <app-order-timeline [status]="o.status" />
          </section>

          <section aria-labelledby="items-h" class="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 id="items-h" class="text-base font-extrabold text-gray-900">Items</h2>
            </div>
            <table class="w-full text-left text-sm">
              <caption class="sr-only">Items in order {{ o.orderNumber }}</caption>
              <thead class="bg-gray-50/40 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" class="p-4 sm:px-6">Product</th>
                  <th scope="col" class="p-4 sm:px-6">Price</th>
                  <th scope="col" class="p-4 sm:px-6">Qty</th>
                  <th scope="col" class="p-4 sm:px-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (item of o.items; track item.productId) {
                  <tr>
                    <td class="p-4 sm:px-6 font-bold text-gray-900">{{ item.productName }}</td>
                    <td class="p-4 sm:px-6 text-gray-600">{{ item.price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                    <td class="p-4 sm:px-6 text-gray-600">{{ item.quantity }}</td>
                    <td class="p-4 sm:px-6 text-right font-black text-gray-900">
                      {{ item.price * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <div class="grid gap-6 md:grid-cols-2">
            <section aria-labelledby="ship-h" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
              <h2 id="ship-h" class="text-base font-extrabold text-gray-900 mb-3">Shipping to</h2>
              <address class="text-sm not-italic text-gray-700 leading-relaxed">
                <span class="font-bold text-gray-900 block text-base">{{ o.shippingAddress.fullName }}</span>
                {{ o.shippingAddress.address }}<br />
                {{ o.shippingAddress.city }}<br />
                <span class="text-gray-500 text-xs mt-1 block">📞 {{ o.shippingAddress.phone }}</span>
              </address>
            </section>

            <section aria-labelledby="sum-h" class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
              <h2 id="sum-h" class="text-base font-extrabold text-gray-900 mb-3">Summary</h2>
              <dl class="space-y-2.5 text-sm">
                <div class="flex justify-between text-gray-600">
                  <dt>Subtotal</dt>
                  <dd class="font-bold text-gray-900">{{ o.subtotal | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Discount</dt>
                  <dd class="font-bold text-emerald-700">−{{ o.discount | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>Shipping</dt>
                  <dd class="font-bold text-gray-900">{{ o.shippingCost | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
                <div class="flex justify-between border-t border-gray-100 pt-3 text-base font-black text-gray-900">
                  <dt>Total</dt>
                  <dd class="text-xl text-[#003d29]">{{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </article>
      }
    </div>
  `,
})
export class OrderDetails {
  readonly id = input.required<string>();
  readonly backLink = input('/store/orders');

  private readonly repo = inject(OrderRepository);
  private readonly auth = inject(AuthService);

  protected readonly order = rxResource({ params: () => this.id(), stream: ({ params }) => this.repo.findById(params) });

  /** Admins see every order; customers only their own. */
  protected readonly allowed = computed(() => {
    const order = this.order.value();
    const user = this.auth.user();
    return !order || (!!user && (user.role === 'admin' || order.customerId === user.id));
  });

  protected print(): void {
    window.print();
  }
}
