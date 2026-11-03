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
    <h1 class="mb-4 text-2xl font-bold">Inventory</h1>

    @if (selected(); as product) {
      <form [formGroup]="form" (ngSubmit)="submit(product)" class="mb-6 grid max-w-xl gap-3 rounded-xl border border-gray-200 bg-white p-4" novalidate>
        <h2 class="font-semibold">Adjust stock: {{ product.name }} (now {{ product.stock }})</h2>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col text-sm">Change (+ add, − remove)
            <input type="number" step="1" formControlName="change" class="rounded-lg border border-gray-400 px-3 py-2" />
          </label>
          <label class="flex flex-col text-sm">Reason
            <select formControlName="reason" class="rounded-lg border border-gray-400 px-3 py-2">
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </label>
        </div>
        <label class="flex flex-col text-sm">Note (optional)
          <input formControlName="note" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
        @if (message(); as text) { <p role="alert" class="text-rose-700">{{ text }}</p> }
        <div class="flex gap-3">
          <button type="submit" class="rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800">Apply</button>
          <button type="button" class="rounded-lg border border-gray-400 px-4 py-2" (click)="selected.set(null)">Cancel</button>
        </div>
      </form>
    }

    <label class="mb-4 flex max-w-xs flex-col text-sm">Show
      <select class="rounded-lg border border-gray-400 px-3 py-2" (change)="filter.set($any($event.target).value)">
        <option value="all">All products</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
    </label>

    @if (data.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (data.error()) {
      <p role="alert" class="text-rose-700">{{ data.error()?.message }}</p>
    } @else {
      <table class="mb-10 w-full max-w-3xl rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">Stock levels</caption>
        <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Product</th><th scope="col" class="p-3">SKU</th><th scope="col" class="p-3">Stock</th><th scope="col" class="p-3">Level</th><th scope="col" class="p-3">Action</th></tr></thead>
        <tbody>
          @for (p of visible(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ p.name }}</td>
              <td class="p-3">{{ p.sku }}</td>
              <td class="p-3">{{ p.stock }}</td>
              <td class="p-3"><app-status-badge [status]="label(p)" /></td>
              <td class="p-3"><button type="button" class="text-violet-800 underline" (click)="select(p)">Adjust</button></td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="p-3">Nothing to show.</td></tr>
          }
        </tbody>
      </table>

      <h2 class="mb-2 font-semibold">Recent stock movements</h2>
      <table class="w-full max-w-3xl rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">Recent stock movements</caption>
        <thead class="bg-gray-100"><tr><th scope="col" class="p-3">When</th><th scope="col" class="p-3">Product</th><th scope="col" class="p-3">Change</th><th scope="col" class="p-3">Reason</th><th scope="col" class="p-3">Note</th></tr></thead>
        <tbody>
          @for (t of data.value()?.history; track t.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3">{{ t.createdAt | date: 'short' }}</td>
              <td class="p-3">{{ t.productName }}</td>
              <td class="p-3">{{ t.change > 0 ? '+' + t.change : t.change }}</td>
              <td class="p-3 capitalize">{{ t.reason }}</td>
              <td class="p-3">{{ t.note ?? '—' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="p-3">No movements yet.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class Inventory {
  private readonly products = inject(ProductRepository);
  private readonly ledger = inject(InventoryRepository);
  private readonly service = inject(InventoryService);

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
