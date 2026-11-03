import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { nextStatuses } from '../../../core/domain/order-workflow';
import { Order, OrderStatus } from '../../../core/models';
import { OrderRepository } from '../../../core/repositories/repositories';
import { OrderService } from '../../../core/services/order.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-admin-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge],
  template: `
    <div class="space-y-6 font-sans">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Fulfillment Operations</span>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">Order Management</h1>
          <p class="text-xs text-gray-500 mt-0.5">Track fulfillments, customer deliveries, and lifecycle transitions</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-[#003d29]">
            {{ (orders.value() ?? []).length }} Total Orders
          </span>
        </div>
      </div>

      <!-- Filter & Search Controls -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <label class="flex items-center gap-2 text-xs font-bold text-gray-700 w-full sm:w-80">
          <span class="sr-only">Search orders</span>
          <div class="relative w-full">
            <input
              type="search"
              placeholder="Search by order # or customer..."
              class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" aria-hidden="true">🔍</span>
          </div>
        </label>

        <!-- Status Filter Pills -->
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            class="rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer"
            [class.bg-[#003d29]]="statusFilter() === 'all'"
            [class.text-white]="statusFilter() === 'all'"
            [class.bg-gray-100]="statusFilter() !== 'all'"
            [class.text-gray-700]="statusFilter() !== 'all'"
            [class.hover:bg-gray-200]="statusFilter() !== 'all'"
            (click)="statusFilter.set('all')"
          >
            All
          </button>
          @for (s of ['processing', 'shipped', 'delivered', 'cancelled']; track s) {
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-bold capitalize transition cursor-pointer"
              [class.bg-[#003d29]]="statusFilter() === s"
              [class.text-white]="statusFilter() === s"
              [class.bg-gray-100]="statusFilter() !== s"
              [class.text-gray-700]="statusFilter() !== s"
              [class.hover:bg-gray-200]="statusFilter() !== s"
              (click)="statusFilter.set(s)"
            >
              {{ s }}
            </button>
          }
        </div>
      </div>

      @if (actionError(); as message) {
        <p role="alert" class="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {{ message }}
        </p>
      }

      @if (orders.isLoading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-16 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (orders.error()) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {{ orders.error()?.message }}
        </p>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table class="w-full text-left text-xs">
            <caption class="sr-only">All customer orders</caption>
            <thead class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" class="py-3.5 px-4">Order ID</th>
                <th scope="col" class="py-3.5 px-4">Customer</th>
                <th scope="col" class="py-3.5 px-4">Date</th>
                <th scope="col" class="py-3.5 px-4">Amount</th>
                <th scope="col" class="py-3.5 px-4">Status</th>
                <th scope="col" class="py-3.5 px-4">Transitions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (o of visible(); track o.id) {
                <tr class="hover:bg-gray-50/50 transition">
                  <td class="py-3.5 px-4 font-bold">
                    <a [routerLink]="['/admin/orders', o.id]" class="text-[#003d29] hover:underline font-mono">
                      {{ o.orderNumber }}
                    </a>
                  </td>
                  <td class="py-3.5 px-4 font-medium text-gray-900">
                    <div>{{ o.shippingAddress.fullName }}</div>
                    <div class="text-[11px] text-gray-400">{{ o.shippingAddress.city }}</div>
                  </td>
                  <td class="py-3.5 px-4 text-gray-600">
                    {{ o.createdAt | date: 'mediumDate' }}
                  </td>
                  <td class="py-3.5 px-4 font-black text-gray-900">
                    {{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                  </td>
                  <td class="py-3.5 px-4">
                    <app-status-badge [status]="o.status" />
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (next of allowed(o); track next) {
                        <button
                          type="button"
                          class="rounded-full border border-[#003d29] px-2.5 py-1 text-[11px] font-bold text-[#003d29] capitalize hover:bg-[#003d29] hover:text-white transition cursor-pointer"
                          (click)="change(o, next)"
                        >
                          → {{ next }}
                        </button>
                      } @empty {
                        <span class="text-gray-400 font-bold text-xs">—</span>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-8 text-center text-gray-500 font-medium">
                    No matching orders found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminOrders {
  private readonly repo = inject(OrderRepository);
  private readonly service = inject(OrderService);

  protected readonly orders = rxResource({ stream: () => this.repo.findAll() });
  protected readonly query = signal('');
  protected readonly statusFilter = signal('all');
  protected readonly actionError = signal('');

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const sf = this.statusFilter();
    return (this.orders.value() ?? []).filter((o) => {
      const matchesQuery = o.orderNumber.toLowerCase().includes(q) || o.shippingAddress.fullName.toLowerCase().includes(q);
      const matchesStatus = sf === 'all' || o.status === sf;
      return matchesQuery && matchesStatus;
    });
  });

  protected allowed(order: Order): readonly OrderStatus[] {
    return nextStatuses(order.status);
  }

  protected change(order: Order, status: OrderStatus): void {
    this.service.updateStatus(order, status).subscribe({
      next: () => {
        this.actionError.set('');
        this.orders.reload();
      },
      error: (e: Error) => this.actionError.set(e.message),
    });
  }
}
