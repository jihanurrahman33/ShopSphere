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
    <h1 class="mb-4 text-2xl font-bold">My orders</h1>
    @if (placed(); as number) {
      <p role="status" class="mb-4 rounded-lg bg-emerald-100 p-3 text-emerald-900">Order {{ number }} placed. Thank you!</p>
    }
    @if (orders.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (orders.error()) {
      <p role="alert" class="text-rose-700">{{ orders.error()?.message }}</p>
    } @else {
      <ul class="space-y-3">
        @for (order of orders.value(); track order.id) {
          <li class="rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <a [routerLink]="['/store/orders', order.id]" class="font-bold text-violet-800 underline">{{ order.orderNumber }}</a>
              <app-status-badge [status]="order.status" />
            </div>
            <p class="text-sm text-gray-700">{{ order.createdAt | date: 'medium' }} · {{ order.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</p>
            <ul class="mt-2 text-sm">
              @for (item of order.items; track item.productId) {
                <li>{{ item.productName }} × {{ item.quantity }}</li>
              }
            </ul>
          </li>
        } @empty {
          <li>You have no orders yet.</li>
        }
      </ul>
    }
  `,
})
export class Orders {
  /** From ?placed= query param after checkout. */
  readonly placed = input<string>();

  private readonly repo = inject(OrderRepository);
  private readonly auth = inject(AuthService);

  protected readonly orders = rxResource({
    params: () => this.auth.user()?.id,
    stream: ({ params }) => (params ? this.repo.findByCustomer(params) : of([])),
  });
}
