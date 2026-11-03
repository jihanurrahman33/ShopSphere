import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { OrderRepository, ProductRepository } from '../../../core/repositories/repositories';

const LOW_STOCK_THRESHOLD = 10;

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe],
  template: `
    <h1 class="mb-6 text-2xl font-bold">Dashboard</h1>
    @if (data.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (data.error()) {
      <p role="alert" class="text-rose-700">{{ data.error()?.message }}</p>
    } @else {
      <dl class="grid grid-cols-2 gap-4 md:grid-cols-4">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <dt class="text-sm text-gray-700">{{ stat.label }}</dt>
            <dd class="mt-2 text-2xl font-bold">{{ stat.money ? (stat.value | currency: 'BDT' : 'symbol-narrow' : '1.0-0') : stat.value }}</dd>
          </div>
        }
      </dl>
    }
  `,
})
export class Dashboard {
  private readonly products = inject(ProductRepository);
  private readonly orders = inject(OrderRepository);

  protected readonly data = rxResource({
    stream: () => forkJoin({ products: this.products.findAll(), orders: this.orders.findAll() }),
  });

  protected readonly stats = computed(() => {
    const { products = [], orders = [] } = this.data.value() ?? {};
    return [
      { label: 'Total revenue', value: orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0), money: true },
      { label: 'Total orders', value: orders.length, money: false },
      { label: 'Pending orders', value: orders.filter((o) => o.status === 'pending').length, money: false },
      { label: 'Low-stock products', value: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length, money: false },
    ];
  });
}
