import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { dailySales, isRevenueOrder, monthOverMonth, recentOrders, topProducts } from '../../../core/domain/reports';
import { LOW_STOCK_THRESHOLD } from '../../../core/domain/stock';
import { OrderRepository, ProductRepository, UserRepository } from '../../../core/repositories/repositories';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

const CHART_DAYS = 7;
const LIST_SIZE = 5;
const MAX_PERCENT = 100;

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge],
  template: `
    <h1 class="mb-6 text-2xl font-bold">Dashboard</h1>
    @if (data.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (data.error()) {
      <p role="alert" class="text-rose-700">{{ data.error()?.message }}</p>
    } @else {
      <dl class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <dt class="text-sm text-gray-700">{{ stat.label }}</dt>
            <dd class="mt-1 text-xl font-bold">{{ stat.money ? (stat.value | currency: 'BDT' : 'symbol-narrow' : '1.0-0') : stat.value }}</dd>
          </div>
        }
      </dl>

      <section class="mt-6 rounded-xl border border-gray-200 bg-white p-4" aria-labelledby="cmp-h">
        <h2 id="cmp-h" class="mb-2 font-semibold">Revenue: this month vs last month</h2>
        <p>
          {{ comparison().current | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
          <span class="text-gray-700">vs {{ comparison().previous | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span>
          @if (comparison().changePercent !== null) {
            <strong [class]="(comparison().changePercent ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
              ({{ (comparison().changePercent ?? 0) >= 0 ? '+' : '' }}{{ comparison().changePercent }}%)
            </strong>
          } @else {
            <span class="text-gray-700">(no revenue last month to compare)</span>
          }
        </p>
      </section>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 bg-white p-4" aria-labelledby="chart-h">
          <h2 id="chart-h" class="mb-3 font-semibold">Sales, last {{ chartDays }} days with sales</h2>
          <ul class="space-y-2 text-sm">
            @for (d of chart(); track d.period) {
              <li class="flex items-center gap-3">
                <span class="w-24 shrink-0">{{ d.period }}</span>
                <span class="h-3 flex-1 rounded bg-gray-100" aria-hidden="true"><span class="block h-3 rounded bg-violet-700" [style.width.%]="d.percent"></span></span>
                <span class="w-24 shrink-0 text-right">{{ d.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span>
              </li>
            } @empty {
              <li>No sales yet.</li>
            }
          </ul>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-4" aria-labelledby="top-h">
          <h2 id="top-h" class="mb-3 font-semibold">Top-selling products</h2>
          <ol class="space-y-1 text-sm">
            @for (p of top(); track p.productId) {
              <li class="flex justify-between"><span>{{ p.name }}</span><span>{{ p.quantity }} sold</span></li>
            } @empty {
              <li>No sales yet.</li>
            }
          </ol>
        </section>
      </div>

      <section class="mt-6 rounded-xl border border-gray-200 bg-white p-4" aria-labelledby="recent-h">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="recent-h" class="font-semibold">Recent orders</h2>
          <a routerLink="/admin/orders" class="text-sm text-violet-800 underline">View all</a>
        </div>
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Recent orders</caption>
          <thead><tr><th scope="col" class="p-2">Order</th><th scope="col" class="p-2">Customer</th><th scope="col" class="p-2">Date</th><th scope="col" class="p-2">Total</th><th scope="col" class="p-2">Status</th></tr></thead>
          <tbody>
            @for (o of recent(); track o.id) {
              <tr class="border-t border-gray-200">
                <td class="p-2 font-medium">{{ o.orderNumber }}</td>
                <td class="p-2">{{ o.shippingAddress.fullName }}</td>
                <td class="p-2">{{ o.createdAt | date: 'short' }}</td>
                <td class="p-2">{{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                <td class="p-2"><app-status-badge [status]="o.status" /></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="p-2">No orders yet.</td></tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class Dashboard {
  private readonly products = inject(ProductRepository);
  private readonly orders = inject(OrderRepository);
  private readonly users = inject(UserRepository);
  private readonly now = new Date();

  protected readonly chartDays = CHART_DAYS;
  protected readonly data = rxResource({
    stream: () =>
      forkJoin({
        products: this.products.findAll(),
        orders: this.orders.findAll(),
        customers: this.users.findAll({ role: 'customer' }),
      }),
  });

  private readonly orderList = computed(() => this.data.value()?.orders ?? []);

  protected readonly stats = computed(() => {
    const { products = [], customers = [] } = this.data.value() ?? {};
    const orders = this.orderList();
    return [
      { label: 'Total revenue', value: orders.filter(isRevenueOrder).reduce((s, o) => s + o.total, 0), money: true },
      { label: 'Total orders', value: orders.length, money: false },
      { label: 'Pending orders', value: orders.filter((o) => o.status === 'pending').length, money: false },
      { label: 'Products', value: products.length, money: false },
      { label: 'Customers', value: customers.length, money: false },
      { label: 'Low-stock products', value: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length, money: false },
    ];
  });

  protected readonly comparison = computed(() => monthOverMonth(this.orderList(), this.now));
  protected readonly top = computed(() => topProducts(this.orderList(), LIST_SIZE));
  protected readonly recent = computed(() => recentOrders(this.orderList(), LIST_SIZE));

  protected readonly chart = computed(() => {
    const days = dailySales(this.orderList()).slice(-CHART_DAYS);
    const max = Math.max(1, ...days.map((d) => d.revenue));
    return days.map((d) => ({ ...d, percent: Math.round((d.revenue / max) * MAX_PERCENT) }));
  });
}
