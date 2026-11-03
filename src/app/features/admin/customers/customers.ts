import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Order } from '../../../core/models';
import { OrderRepository, UserRepository } from '../../../core/repositories/repositories';

interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly orderCount: number;
  readonly spent: number;
}

/** Cancelled and returned orders do not count towards spend. */
function countsAsSpend(order: Order): boolean {
  return order.status !== 'cancelled' && order.status !== 'returned';
}

@Component({
  selector: 'app-admin-customers',
  imports: [CurrencyPipe],
  template: `
    <div class="space-y-6 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">User Directory</span>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">Customers</h1>
          <p class="text-xs text-gray-500 mt-0.5">Review registered buyer accounts, orders placed, and lifetime value</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex items-center justify-between">
        <label class="flex items-center gap-2 text-xs font-bold text-gray-700 w-full sm:w-80">
          <span class="sr-only">Search customers</span>
          <div class="relative w-full">
            <input
              type="search"
              placeholder="Search by name or email..."
              class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" aria-hidden="true">🔍</span>
          </div>
        </label>
        <span class="text-xs font-semibold text-gray-500">
          {{ visible().length }} Customers
        </span>
      </div>

      @if (data.isLoading()) {
        <p role="status" class="text-sm text-gray-500 animate-pulse">Loading customers…</p>
      } @else if (data.error()) {
        <p role="alert" class="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-700">{{ data.error()?.message }}</p>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table class="w-full text-left text-xs">
            <caption class="sr-only">Customers</caption>
            <thead class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" class="py-3.5 px-4">Customer Name</th>
                <th scope="col" class="py-3.5 px-4">Email</th>
                <th scope="col" class="py-3.5 px-4">Orders</th>
                <th scope="col" class="py-3.5 px-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (c of visible(); track c.id) {
                <tr class="hover:bg-gray-50/50 transition">
                  <td class="py-3.5 px-4 font-bold text-gray-900">{{ c.name }}</td>
                  <td class="py-3.5 px-4 text-gray-600">{{ c.email }}</td>
                  <td class="py-3.5 px-4 font-semibold text-gray-800">{{ c.orderCount }}</td>
                  <td class="py-3.5 px-4 text-right font-black text-[#003d29]">{{ c.spent | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="p-8 text-center text-gray-500">No customers found.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class Customers {
  private readonly users = inject(UserRepository);
  private readonly orders = inject(OrderRepository);

  protected readonly data = rxResource({
    stream: () => forkJoin({ users: this.users.findAll({ role: 'customer' }), orders: this.orders.findAll() }),
  });
  protected readonly query = signal('');

  /** Customer info plus order stats; passwords are never read into the row. */
  private readonly rows = computed<readonly CustomerRow[]>(() => {
    const { users = [], orders = [] } = this.data.value() ?? {};
    return users.map((u) => {
      const mine = orders.filter((o) => o.customerId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        orderCount: mine.length,
        spent: mine.filter(countsAsSpend).reduce((sum, o) => sum + o.total, 0),
      };
    });
  });

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.rows().filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  });
}
