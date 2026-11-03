import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { categorySales, dailySales, monthlySales, statusBreakdown, toCsv, topProducts } from '../../../core/domain/reports';
import { CategoryRepository, OrderRepository, ProductRepository } from '../../../core/repositories/repositories';

const TOP_PRODUCTS_LIMIT = 5;

@Component({
  selector: 'app-admin-reports',
  imports: [CurrencyPipe],
  template: `
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Financial Intelligence</span>
        <h1 class="text-2xl font-black tracking-tight text-gray-900">Performance Reports</h1>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-[#003d29] px-5 py-2 text-xs font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        (click)="exportCsv()"
        [disabled]="!data.hasValue()"
      >
        <span>📥 Export daily sales (CSV)</span>
      </button>
    </div>
    @if (data.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (data.error()) {
      <p role="alert" class="text-rose-700">{{ data.error()?.message }}</p>
    } @else {
      <div class="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="daily-h">
          <h2 id="daily-h" class="mb-2 font-semibold">Daily sales</h2>
          <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
            <caption class="sr-only">Daily sales</caption>
            <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Date</th><th scope="col" class="p-3">Orders</th><th scope="col" class="p-3">Revenue</th></tr></thead>
            <tbody>
              @for (r of daily(); track r.period) {
                <tr class="border-t border-gray-200"><td class="p-3">{{ r.period }}</td><td class="p-3">{{ r.orders }}</td><td class="p-3">{{ r.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td></tr>
              } @empty { <tr><td colspan="3" class="p-3">No sales yet.</td></tr> }
            </tbody>
          </table>
        </section>

        <section aria-labelledby="monthly-h">
          <h2 id="monthly-h" class="mb-2 font-semibold">Monthly sales</h2>
          <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
            <caption class="sr-only">Monthly sales</caption>
            <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Month</th><th scope="col" class="p-3">Orders</th><th scope="col" class="p-3">Revenue</th></tr></thead>
            <tbody>
              @for (r of monthly(); track r.period) {
                <tr class="border-t border-gray-200"><td class="p-3">{{ r.period }}</td><td class="p-3">{{ r.orders }}</td><td class="p-3">{{ r.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td></tr>
              } @empty { <tr><td colspan="3" class="p-3">No sales yet.</td></tr> }
            </tbody>
          </table>
        </section>

        <section aria-labelledby="top-h">
          <h2 id="top-h" class="mb-2 font-semibold">Top-selling products</h2>
          <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
            <caption class="sr-only">Top-selling products</caption>
            <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Product</th><th scope="col" class="p-3">Units</th><th scope="col" class="p-3">Revenue</th></tr></thead>
            <tbody>
              @for (r of top(); track r.productId) {
                <tr class="border-t border-gray-200"><td class="p-3">{{ r.name }}</td><td class="p-3">{{ r.quantity }}</td><td class="p-3">{{ r.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td></tr>
              } @empty { <tr><td colspan="3" class="p-3">No sales yet.</td></tr> }
            </tbody>
          </table>
        </section>

        <section aria-labelledby="cat-h">
          <h2 id="cat-h" class="mb-2 font-semibold">Sales by category</h2>
          <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
            <caption class="sr-only">Sales by category</caption>
            <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Category</th><th scope="col" class="p-3">Revenue</th></tr></thead>
            <tbody>
              @for (r of byCategory(); track r.name) {
                <tr class="border-t border-gray-200"><td class="p-3">{{ r.name }}</td><td class="p-3">{{ r.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td></tr>
              } @empty { <tr><td colspan="2" class="p-3">No sales yet.</td></tr> }
            </tbody>
          </table>
        </section>

        <section aria-labelledby="status-h">
          <h2 id="status-h" class="mb-2 font-semibold">Orders by status</h2>
          <ul class="rounded-xl border border-gray-200 bg-white p-3 text-sm">
            @for (r of statuses(); track r.status) {
              <li class="flex justify-between py-1"><span class="capitalize">{{ r.status }}</span><span>{{ r.count }}</span></li>
            } @empty { <li>No orders yet.</li> }
          </ul>
        </section>
      </div>
    }
  `,
})
export class Reports {
  private readonly orders = inject(OrderRepository);
  private readonly products = inject(ProductRepository);
  private readonly categories = inject(CategoryRepository);

  protected readonly data = rxResource({
    stream: () => forkJoin({ orders: this.orders.findAll(), products: this.products.findAll(), categories: this.categories.findAll() }),
  });

  private readonly orderList = computed(() => this.data.value()?.orders ?? []);
  protected readonly daily = computed(() => dailySales(this.orderList()));
  protected readonly monthly = computed(() => monthlySales(this.orderList()));
  protected readonly top = computed(() => topProducts(this.orderList(), TOP_PRODUCTS_LIMIT));
  protected readonly statuses = computed(() => statusBreakdown(this.orderList()));

  protected readonly byCategory = computed(() => {
    const { products = [], categories = [] } = this.data.value() ?? {};
    const categoryOf = new Map(products.map((p) => [p.id, p.categoryId]));
    const names = new Map(categories.map((c) => [c.id, c.name]));
    return categorySales(this.orderList(), categoryOf).map((r) => ({
      name: names.get(r.categoryId) ?? 'Unknown',
      revenue: r.revenue,
    }));
  });

  protected exportCsv(): void {
    const csv = toCsv(['Date', 'Orders', 'Revenue'], this.daily().map((r) => [r.period, r.orders, r.revenue]));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'daily-sales.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
