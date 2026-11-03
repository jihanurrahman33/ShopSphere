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
    <h1 class="mb-4 text-2xl font-bold">Customers</h1>
    <label class="mb-4 flex max-w-xs flex-col text-sm">Search by name or email
      <input type="search" class="rounded-lg border border-gray-400 px-3 py-2" [value]="query()" (input)="query.set($any($event.target).value)" />
    </label>
    @if (data.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (data.error()) {
      <p role="alert" class="text-rose-700">{{ data.error()?.message }}</p>
    } @else {
      <table class="w-full max-w-3xl rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">Customers</caption>
        <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Name</th><th scope="col" class="p-3">Email</th><th scope="col" class="p-3">Orders</th><th scope="col" class="p-3">Total spent</th></tr></thead>
        <tbody>
          @for (c of visible(); track c.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ c.name }}</td>
              <td class="p-3">{{ c.email }}</td>
              <td class="p-3">{{ c.orderCount }}</td>
              <td class="p-3">{{ c.spent | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="p-3">No customers found.</td></tr>
          }
        </tbody>
      </table>
    }
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
