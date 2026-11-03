import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StockLevel, stockLevel } from '../../../core/domain/stock';
import { InventoryReason, Product } from '../../../core/models';
import { InventoryRepository, ProductRepository } from '../../../core/repositories/repositories';
import { InventoryService } from '../../../core/services/inventory.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

type Filter = 'all' | 'low' | 'out';
const HISTORY_LIMIT = 20;
const LEVEL_LABEL: Readonly<Record<StockLevel, string>> = { out: 'Out of stock', low: 'Low stock', ok: 'In stock' };

@Component({
  selector: 'app-admin-inventory',
  imports: [ReactiveFormsModule, DatePipe, StatusBadge],
  template: `
    <div class="space-y-6 font-sans">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Warehousing & Logistics</span>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">Inventory & Stock Ledger</h1>
          <p class="text-xs text-gray-500 mt-0.5">Audit item quantities, execute restocks, and review transaction movements</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-[#003d29]">
            {{ (data.value()?.products ?? []).length }} Total SKUs
          </span>
        </div>
      </div>

      <!-- Stock Adjustment Form Modal / Card -->
      @if (selected(); as product) {
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs">
          <form [formGroup]="form" (ngSubmit)="submit(product)" class="space-y-4 max-w-xl" novalidate>
            <div class="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <h2 class="text-base font-bold text-gray-900">Adjust Stock Level</h2>
                <p class="text-xs text-gray-500">{{ product.name }} (Current: <span class="font-bold text-gray-800">{{ product.stock }} units</span>)</p>
              </div>
              <button type="button" class="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer" (click)="selected.set(null)">✕</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="flex flex-col text-xs font-bold text-gray-700">
                Quantity Change (+ add, − remove)
                <input
                  type="number"
                  step="1"
                  formControlName="change"
                  class="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#003d29] focus:outline-none"
                />
              </label>

              <label class="flex flex-col text-xs font-bold text-gray-700">
                Reason
                <select
                  formControlName="reason"
                  class="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#003d29] focus:outline-none"
                >
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment / Audit</option>
                  <option value="return">Customer Return</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col text-xs font-bold text-gray-700">
              Transaction Note (Optional)
              <input
                formControlName="note"
                placeholder="e.g. Received shipment from warehouse"
                class="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#003d29] focus:outline-none"
              />
            </label>

            @if (message(); as text) {
              <p role="alert" class="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700">{{ text }}</p>
            }

            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                class="rounded-full bg-[#003d29] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#002e1f] transition cursor-pointer"
              >
                Save Adjustment
              </button>
              <button
                type="button"
                class="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                (click)="selected.set(null)"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Filter Controls Bar -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-gray-500">Filter Stock:</span>
          <div class="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer"
              [class.bg-[#003d29]]="filter() === 'all'"
              [class.text-white]="filter() === 'all'"
              [class.bg-gray-100]="filter() !== 'all'"
              [class.text-gray-700]="filter() !== 'all'"
              [class.hover:bg-gray-200]="filter() !== 'all'"
              (click)="filter.set('all')"
            >
              All Items
            </button>
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer"
              [class.bg-[#003d29]]="filter() === 'low'"
              [class.text-white]="filter() === 'low'"
              [class.bg-gray-100]="filter() !== 'low'"
              [class.text-gray-700]="filter() !== 'low'"
              [class.hover:bg-gray-200]="filter() !== 'low'"
              (click)="filter.set('low')"
            >
              Low Stock (&le; 5)
            </button>
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-bold transition cursor-pointer"
              [class.bg-[#003d29]]="filter() === 'out'"
              [class.text-white]="filter() === 'out'"
              [class.bg-gray-100]="filter() !== 'out'"
              [class.text-gray-700]="filter() !== 'out'"
              [class.hover:bg-gray-200]="filter() !== 'out'"
              (click)="filter.set('out')"
            >
              Out of Stock (0)
            </button>
          </div>
        </div>

        <span class="text-xs text-gray-500 font-medium">
          Showing {{ visible().length }} items
        </span>
      </div>

      @if (data.isLoading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-20 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (data.error()) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {{ data.error()?.message }}
        </p>
      } @else {
        <!-- Products Stock Table -->
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table class="w-full text-left text-xs">
            <caption class="sr-only">Stock levels</caption>
            <thead class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" class="py-3.5 px-4">Product</th>
                <th scope="col" class="py-3.5 px-4">SKU</th>
                <th scope="col" class="py-3.5 px-4">Available Stock</th>
                <th scope="col" class="py-3.5 px-4">Status</th>
                <th scope="col" class="py-3.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of visible(); track p.id) {
                <tr class="hover:bg-gray-50/50 transition">
                  <td class="py-3.5 px-4 font-bold text-gray-900">{{ p.name }}</td>
                  <td class="py-3.5 px-4 font-mono text-gray-500">{{ p.sku }}</td>
                  <td class="py-3.5 px-4 font-black text-gray-900">{{ p.stock }} units</td>
                  <td class="py-3.5 px-4"><app-status-badge [status]="label(p)" /></td>
                  <td class="py-3.5 px-4">
                    <button
                      type="button"
                      class="rounded-full border border-[#003d29] px-3 py-1 font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition cursor-pointer"
                      (click)="select(p)"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="p-8 text-center text-gray-500">Nothing to show.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Recent Stock Movements -->
        <div class="space-y-3 pt-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-gray-900 tracking-tight">Recent Stock Movements</h2>
            <span class="text-xs text-gray-400 font-medium">Last {{ historyLimit }} transactions</span>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table class="w-full text-left text-xs">
              <caption class="sr-only">Recent stock movements</caption>
              <thead class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th scope="col" class="py-3 px-4">Date & Time</th>
                  <th scope="col" class="py-3 px-4">Product Name</th>
                  <th scope="col" class="py-3 px-4">Quantity Change</th>
                  <th scope="col" class="py-3 px-4">Reason</th>
                  <th scope="col" class="py-3 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (t of data.value()?.history; track t.id) {
                  <tr class="hover:bg-gray-50/50 transition">
                    <td class="py-3 px-4 text-gray-500">{{ t.createdAt | date: 'short' }}</td>
                    <td class="py-3 px-4 font-bold text-gray-900">{{ t.productName }}</td>
                    <td class="py-3 px-4 font-mono font-bold" [class.text-emerald-700]="t.change > 0" [class.text-rose-700]="t.change < 0">
                      {{ t.change > 0 ? '+' + t.change : t.change }}
                    </td>
                    <td class="py-3 px-4 capitalize font-medium text-gray-700">{{ t.reason }}</td>
                    <td class="py-3 px-4 text-gray-500 italic">{{ t.note ?? '—' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="p-8 text-center text-gray-500">No movements recorded yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class Inventory {
  private readonly products = inject(ProductRepository);
  private readonly ledger = inject(InventoryRepository);
  private readonly service = inject(InventoryService);

  protected readonly historyLimit = HISTORY_LIMIT;
  protected readonly data = rxResource({
    stream: () => forkJoin({ products: this.products.findAll(), history: this.ledger.findRecent(HISTORY_LIMIT) }),
  });
  protected readonly filter = signal<Filter>('all');
  protected readonly selected = signal<Product | null>(null);
  protected readonly message = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    change: [0, Validators.required],
    reason: ['restock' as InventoryReason],
    note: [''],
  });

  protected readonly visible = computed(() => {
    const filter = this.filter();
    return (this.data.value()?.products ?? []).filter((p) => filter === 'all' || stockLevel(p.stock) === filter);
  });

  protected label(product: Product): string {
    return LEVEL_LABEL[stockLevel(product.stock)];
  }

  protected select(product: Product): void {
    this.message.set('');
    this.form.reset({ change: 0, reason: 'restock', note: '' });
    this.selected.set(product);
  }

  protected submit(product: Product): void {
    const { change, reason, note } = this.form.getRawValue();
    this.service.adjust(product, Number(change), reason, note.trim() || undefined).subscribe({
      next: () => {
        this.selected.set(null);
        this.data.reload();
      },
      error: (e: Error) => this.message.set(e.message),
    });
  }
}
