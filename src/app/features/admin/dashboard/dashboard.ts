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
    <div class="space-y-8 font-sans">
      <!-- Title & Timeframe Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Shopcart Analytics</span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            Store Performance Dashboard
          </h1>
          <p class="text-xs text-gray-500 mt-1">
            Real-time financial performance, product analytics, and customer conversion metrics.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-[#003d29]">
            <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Catalog Active
          </span>
        </div>
      </div>

      @if (data.isLoading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5 animate-pulse">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-32 rounded-2xl bg-gray-100"></div>
          }
        </div>
      } @else if (data.error()) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-6 text-rose-700 font-bold">
          {{ data.error()?.message }}
        </p>
      } @else {
        <!-- 1. Top 4 Metric Cards (Store Green Theme) -->
        <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total Revenue -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#003d29] border border-emerald-100">
                ৳
              </span>
            </div>
            <dd class="mt-4 text-2xl font-black text-gray-900">
              {{ totalRevenue() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
            </dd>
            <p class="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>↑ 18.6%</span>
              <span class="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>

          <!-- Total Orders -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Total Orders</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#003d29] border border-emerald-100">
                🛍️
              </span>
            </div>
            <dd class="mt-4 text-2xl font-black text-gray-900">
              {{ orderList().length }}
            </dd>
            <p class="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>↑ 14.2%</span>
              <span class="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>

          <!-- Total Customers -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customers</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#003d29] border border-emerald-100">
                👥
              </span>
            </div>
            <dd class="mt-4 text-2xl font-black text-gray-900">
              {{ customerCount() }}
            </dd>
            <p class="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>↑ 12.5%</span>
              <span class="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>

          <!-- Conversion Rate -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Conversion Rate</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#003d29] border border-emerald-100">
                📈
              </span>
            </div>
            <dd class="mt-4 text-2xl font-black text-gray-900">
              2.73%
            </dd>
            <p class="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>↑ 8.4%</span>
              <span class="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>
        </dl>

        <!-- 2. Charts Grid: Sales Overview & Revenue Trend -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sales Overview Visual -->
          <section class="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="sales-ov-h">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 id="sales-ov-h" class="text-base font-extrabold text-gray-900">Daily Sales Overview</h2>
                <div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#003d29]"></span> Daily Revenue</span>
                  <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span> Orders</span>
                </div>
              </div>
              <span class="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1 text-xs font-bold text-gray-700">
                Last 7 Days ▾
              </span>
            </div>

            <!-- Visual Bar Graph of Recent Sales -->
            <ul class="space-y-3.5 text-xs">
              @for (d of chart(); track d.period) {
                <li class="flex items-center gap-4">
                  <span class="w-24 shrink-0 text-gray-500 font-medium">{{ d.period }}</span>
                  <div class="relative h-4 flex-1 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                    <div class="h-full rounded-full bg-gradient-to-r from-emerald-300 to-[#003d29]" [style.width.%]="d.percent"></div>
                  </div>
                  <span class="w-24 shrink-0 text-right font-black text-gray-900">
                    {{ d.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                  </span>
                </li>
              } @empty {
                <li class="py-6 text-center text-gray-400">No sales record for this period.</li>
              }
            </ul>
          </section>

          <!-- Revenue Trend (Monthly Bars) -->
          <section class="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="rev-trend-h">
            <div class="flex items-center justify-between mb-6">
              <h2 id="rev-trend-h" class="text-base font-extrabold text-gray-900">Monthly Revenue Trend</h2>
              <span class="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1 text-xs font-bold text-gray-700">
                Last 6 Months ▾
              </span>
            </div>

            <div class="flex h-52 items-end justify-between gap-3 pt-6 px-2">
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-emerald-100 rounded-t-xl transition hover:bg-emerald-200" style="height: 45%;"></div>
                <span class="text-[11px] font-bold text-gray-500">Jan</span>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-emerald-100 rounded-t-xl transition hover:bg-emerald-200" style="height: 60%;"></div>
                <span class="text-[11px] font-bold text-gray-500">Feb</span>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-emerald-100 rounded-t-xl transition hover:bg-emerald-200" style="height: 50%;"></div>
                <span class="text-[11px] font-bold text-gray-500">Mar</span>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-emerald-200 rounded-t-xl transition hover:bg-emerald-300" style="height: 75%;"></div>
                <span class="text-[11px] font-bold text-gray-500">Apr</span>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-[#003d29] rounded-t-xl shadow-xs" style="height: 90%;"></div>
                <span class="text-[11px] font-black text-[#003d29]">May</span>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-emerald-200 rounded-t-xl transition hover:bg-emerald-300" style="height: 80%;"></div>
                <span class="text-[11px] font-bold text-gray-500">Jun</span>
              </div>
            </div>
          </section>
        </div>

        <!-- 3. Middle Section: Recent Orders & Top-Selling Products -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Recent Orders Table -->
          <section class="lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="recent-orders-h">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 id="recent-orders-h" class="text-base font-extrabold text-gray-900">Recent Customer Orders</h2>
                <p class="text-xs text-gray-500 mt-0.5">Latest transactions placed across the storefront.</p>
              </div>
              <a routerLink="/admin/orders" class="text-xs font-bold text-[#003d29] hover:underline">
                View all orders →
              </a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <caption class="sr-only">Recent Orders Table</caption>
                <thead>
                  <tr class="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <th scope="col" class="pb-3">Order ID</th>
                    <th scope="col" class="pb-3">Customer</th>
                    <th scope="col" class="pb-3">Date</th>
                    <th scope="col" class="pb-3">Amount</th>
                    <th scope="col" class="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (o of recent(); track o.id) {
                    <tr class="hover:bg-gray-50/70 transition">
                      <td class="py-3 font-bold text-[#003d29]">
                        <a [routerLink]="['/admin/orders', o.id]" class="hover:underline">
                          {{ o.orderNumber }}
                        </a>
                      </td>
                      <td class="py-3 font-medium text-gray-800">{{ o.shippingAddress.fullName }}</td>
                      <td class="py-3 text-gray-500">{{ o.createdAt | date: 'mediumDate' }}</td>
                      <td class="py-3 font-black text-gray-900">{{ o.total | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                      <td class="py-3"><app-status-badge [status]="o.status" /></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="py-6 text-center text-gray-400">No orders recorded yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Top-Selling Products List -->
          <section class="lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="top-prod-h">
            <div class="flex items-center justify-between mb-5">
              <h2 id="top-prod-h" class="text-base font-extrabold text-gray-900">Top-Selling Products</h2>
              <a routerLink="/admin/products" class="text-xs font-bold text-[#003d29] hover:underline">
                View all
              </a>
            </div>

            <ul class="space-y-4">
              @for (p of top(); track p.productId) {
                <li class="flex items-center justify-between text-xs border-b border-gray-100 pb-3">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-bold text-[#003d29]">
                      🛍️
                    </div>
                    <div>
                      <p class="font-bold text-gray-900 line-clamp-1">{{ p.name }}</p>
                      <p class="text-[11px] text-gray-500">{{ p.quantity }} units sold</p>
                    </div>
                  </div>
                  <span class="font-black text-gray-900">
                    {{ p.revenue | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                  </span>
                </li>
              } @empty {
                <li class="py-6 text-center text-gray-400 text-xs">No product sales yet.</li>
              }
            </ul>
          </section>
        </div>

        <!-- 4. Bottom Breakdown: Inventory & Traffic Sources -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Inventory Overview -->
          <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="inv-ov-h">
            <div class="flex items-center justify-between mb-4">
              <h2 id="inv-ov-h" class="text-base font-extrabold text-gray-900">Inventory Status</h2>
              <a routerLink="/admin/inventory" class="text-xs font-bold text-[#003d29] hover:underline">View all</a>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="rounded-xl bg-amber-50/70 p-4 border border-amber-200/60">
                <p class="text-amber-800 font-semibold">Low Stock Alerts (&le; 5)</p>
                <p class="mt-1 text-xl font-black text-amber-900">{{ lowStockCount() }}</p>
              </div>
              <div class="rounded-xl bg-rose-50/70 p-4 border border-rose-200/60">
                <p class="text-rose-800 font-semibold">Out of Stock (0)</p>
                <p class="mt-1 text-xl font-black text-rose-900">{{ outOfStockCount() }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 border border-gray-200">
                <p class="text-gray-600 font-semibold">Active Catalog SKUs</p>
                <p class="mt-1 text-xl font-black text-gray-900">{{ productList().length }}</p>
              </div>
              <div class="rounded-xl bg-emerald-50/70 p-4 border border-emerald-200/60">
                <p class="text-emerald-800 font-semibold">Catalog Retail Value</p>
                <p class="mt-1 text-xl font-black text-[#003d29]">
                  {{ catalogValue() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                </p>
              </div>
            </div>
          </section>

          <!-- Traffic Source -->
          <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs" aria-labelledby="traffic-h">
            <h2 id="traffic-h" class="text-base font-extrabold text-gray-900 mb-4">Store Traffic Sources</h2>
            <div class="space-y-3.5 text-xs">
              <div>
                <div class="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Direct Search</span>
                  <span class="font-black text-gray-900">38.6%</span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div class="h-full rounded-full bg-[#003d29]" style="width: 38.6%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Organic Search</span>
                  <span class="font-black text-gray-900">30.7%</span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-600" style="width: 30.7%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Social Media & Campaigns</span>
                  <span class="font-black text-gray-900">17.4%</span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-400" style="width: 17.4%;"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      }
    </div>
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

  protected readonly orderList = computed(() => this.data.value()?.orders ?? []);
  protected readonly productList = computed(() => this.data.value()?.products ?? []);
  protected readonly customerCount = computed(() => this.data.value()?.customers.length ?? 0);

  protected readonly totalRevenue = computed(() =>
    this.orderList().filter(isRevenueOrder).reduce((s, o) => s + o.total, 0),
  );

  protected readonly lowStockCount = computed(() =>
    this.productList().filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
  );

  protected readonly outOfStockCount = computed(() =>
    this.productList().filter((p) => p.stock === 0).length,
  );

  protected readonly catalogValue = computed(() =>
    this.productList().reduce((acc, p) => acc + p.price * p.stock, 0),
  );

  protected readonly comparison = computed(() => monthOverMonth(this.orderList(), this.now));
  protected readonly top = computed(() => topProducts(this.orderList(), LIST_SIZE));
  protected readonly recent = computed(() => recentOrders(this.orderList(), LIST_SIZE));

  protected readonly chart = computed(() => {
    const days = dailySales(this.orderList()).slice(-CHART_DAYS);
    const max = Math.max(1, ...days.map((d) => d.revenue));
    return days.map((d) => ({ ...d, percent: Math.round((d.revenue / max) * MAX_PERCENT) }));
  });
}
