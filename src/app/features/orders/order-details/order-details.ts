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
    <a [routerLink]="backLink()" class="text-sm text-violet-800 underline print:hidden">← Back to orders</a>

    @if (order.isLoading()) {
      <p role="status" class="mt-4">Loading…</p>
    } @else if (order.error() || !allowed()) {
      <p role="alert" class="mt-4 text-rose-700">{{ order.error()?.message ?? 'Order not found.' }}</p>
    } @else if (order.value(); as o) {
      <article class="mt-4 space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">Order {{ o.orderNumber }}</h1>
            <p class="text-sm text-gray-700">Placed {{ o.createdAt | date: 'medium' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <app-status-badge [status]="o.status" />
            <app-status-badge [status]="o.paymentStatus" />
            <button type="button" class="rounded-lg border border-violet-700 px-3 py-1 text-violet-800 print:hidden" (click)="print()">Print invoice</button>
          </div>
        </header>

        <section aria-labelledby="track-h" class="rounded-xl border border-gray-200 bg-white p-4 print:hidden">
          <h2 id="track-h" class="mb-3 font-semibold">Tracking</h2>
          <app-order-timeline [status]="o.status" />
        </section>

        <section aria-labelledby="items-h">
          <h2 id="items-h" class="mb-2 font-semibold">Items</h2>
          <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
            <caption class="sr-only">Items in order {{ o.orderNumber }}</caption>
            <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Product</th><th scope="col" class="p-3">Price</th><th scope="col" class="p-3">Qty</th><th scope="col" class="p-3">Total</th></tr></thead>
            <tbody>
              @for (item of o.items; track item.productId) {
                <tr class="border-t border-gray-200">
                  <td class="p-3">{{ item.productName }}</td>
                  <td class="p-3">{{ item.price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                  <td class="p-3">{{ item.quantity }}</td>
                  <td class="p-3">{{ item.price * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <div class="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="ship-h">
            <h2 id="ship-h" class="mb-2 font-semibold">Shipping to</h2>
            <address class="text-sm not-italic">
              {{ o.shippingAddress.fullName }}<br />{{ o.shippingAddress.address }}, {{ o.shippingAddress.city }}<br />{{ o.shippingAddress.phone }}
            </address>
          </section>
          <section aria-labelledby="sum-h">
            <h2 id="sum-h" class="mb-2 font-semibold">Summary</h2>
            <dl class="space-y-1 text-sm">
              <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ o.subtotal | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
              <div class="flex justify-between"><dt>Discount</dt><dd>−{{ o.discount | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
              <div class="flex justify-between"><dt>Shipping</dt><dd>{{ o.shippingCost | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
              <div class="flex justify-between border-t pt-1 text-base font-bold"><dt>Total</dt><dd>{{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</dd></div>
            </dl>
          </section>
        </div>
      </article>
    }
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
