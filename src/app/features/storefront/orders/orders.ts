import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { OrderRepository } from '../../../core/repositories/repositories';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-gray-900">My Orders</h1>
          <p class="mt-1 text-sm text-gray-500">Track current shipments and view order receipts</p>
        </div>
        <a routerLink="/store/products" class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50">
          Continue Shopping
        </a>
      </div>

      @if (placed(); as number) {
        <div role="status" class="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-900">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-sm font-bold">✓</span>
          <div>
            <p class="font-bold text-sm">Order #{{ number }} placed successfully!</p>
            <p class="text-xs text-emerald-700">A confirmation receipt has been sent to your registered email.</p>
          </div>
        </div>
      }

      @if (orders.isLoading()) {
        <div class="space-y-4 animate-pulse">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-36 rounded-2xl bg-gray-100"></div>
          }
        </div>
      } @else if (orders.error()) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-5 text-rose-700 font-bold">
          {{ orders.error()?.message }}
        </p>
      } @else {
        <ul class="space-y-5">
          @for (order of orders.value(); track order.id) {
            <li class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition hover:shadow-md">
              <!-- Order Header -->
              <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                <div class="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span class="text-gray-400 block uppercase font-bold text-[10px]">Order Number</span>
                    <a [routerLink]="['/store/orders', order.id]" class="font-black text-[#003d29] hover:underline text-sm">
                      {{ order.orderNumber }}
                    </a>
                  </div>
                  <div class="border-l border-gray-200 pl-4">
                    <span class="text-gray-400 block uppercase font-bold text-[10px]">Date Placed</span>
                    <span class="font-semibold text-gray-700">{{ order.createdAt | date: 'mediumDate' }}</span>
                  </div>
                  <div class="border-l border-gray-200 pl-4">
                    <span class="text-gray-400 block uppercase font-bold text-[10px]">Total Amount</span>
                    <span class="font-black text-gray-900">{{ order.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <app-status-badge [status]="order.status" />
                  <a [routerLink]="['/store/orders', order.id]" class="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#003d29] border border-gray-200 hover:bg-[#003d29] hover:text-white hover:border-[#003d29] transition">
                    Details →
                  </a>
                </div>
              </div>

              <!-- Order Items Preview -->
              <div class="p-6">
                <ul class="divide-y divide-gray-50">
                  @for (item of order.items; track item.productId) {
                    <li class="flex items-center justify-between py-2 text-sm">
                      <div class="flex items-center gap-3">
                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm">🛍️</span>
                        <div>
                          <p class="font-bold text-gray-800">{{ item.productName }}</p>
                          <p class="text-xs text-gray-400">Qty: {{ item.quantity }}</p>
                        </div>
                      </div>
                      <span class="font-bold text-gray-900">
                        {{ item.price * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                      </span>
                    </li>
                  }
                </ul>
              </div>
            </li>
          } @empty {
            <li class="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-xs">
              <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-2xl" aria-hidden="true">📦</span>
              <p class="mt-4 text-base font-bold text-gray-900">You have no orders yet</p>
              <p class="mt-1 text-xs text-gray-500">When you place an order, it will appear here for easy tracking.</p>
              <a routerLink="/store/products" class="mt-6 inline-block rounded-full bg-[#003d29] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#002e1f] transition">
                Start Shopping
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class Orders {
  readonly placed = input<string>();

  private readonly repo = inject(OrderRepository);
  private readonly auth = inject(AuthService);

  protected readonly orders = rxResource({
    params: () => this.auth.user()?.id,
    stream: ({ params }) => (params ? this.repo.findByCustomer(params) : of([])),
  });
}
