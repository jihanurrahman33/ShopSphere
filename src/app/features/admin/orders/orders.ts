import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { nextStatuses } from '../../../core/domain/order-workflow';
import { Order, OrderStatus } from '../../../core/models';
import { OrderRepository } from '../../../core/repositories/repositories';
import { OrderService } from '../../../core/services/order.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-admin-orders',
  imports: [CurrencyPipe, DatePipe, StatusBadge],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Orders</h1>
    <label class="mb-4 flex max-w-xs flex-col text-sm">Search by order number or customer
      <input type="search" class="rounded-lg border border-gray-400 px-3 py-2" [value]="query()" (input)="query.set($any($event.target).value)" />
    </label>
    @if (actionError(); as message) {
      <p role="alert" class="mb-2 text-rose-700">{{ message }}</p>
    }
    @if (orders.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (orders.error()) {
      <p role="alert" class="text-rose-700">{{ orders.error()?.message }}</p>
    } @else {
      <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">All orders</caption>
        <thead class="bg-gray-100">
          <tr><th scope="col" class="p-3">Order</th><th scope="col" class="p-3">Customer</th><th scope="col" class="p-3">Date</th><th scope="col" class="p-3">Total</th><th scope="col" class="p-3">Status</th><th scope="col" class="p-3">Update</th></tr>
        </thead>
        <tbody>
          @for (o of visible(); track o.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ o.orderNumber }}</td>
              <td class="p-3">{{ o.shippingAddress.fullName }}</td>
              <td class="p-3">{{ o.createdAt | date: 'short' }}</td>
              <td class="p-3">{{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
              <td class="p-3"><app-status-badge [status]="o.status" /></td>
              <td class="space-x-2 p-3">
                @for (next of allowed(o); track next) {
                  <button type="button" class="rounded border border-violet-700 px-2 py-1 text-violet-800 capitalize" (click)="change(o, next)">{{ next }}</button>
                } @empty {
                  <span class="text-gray-600">—</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="p-3">No orders found.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AdminOrders {
  private readonly repo = inject(OrderRepository);
  private readonly service = inject(OrderService);

  protected readonly orders = rxResource({ stream: () => this.repo.findAll() });
  protected readonly query = signal('');
  protected readonly actionError = signal('');

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return (this.orders.value() ?? []).filter(
      (o) => o.orderNumber.toLowerCase().includes(q) || o.shippingAddress.fullName.toLowerCase().includes(q),
    );
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
