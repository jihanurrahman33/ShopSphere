import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';
import { ProductRepository } from '../../../core/repositories/repositories';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-admin-products',
  imports: [CurrencyPipe, RouterLink, StatusBadge, Pagination],
  template: `
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Products</h1>
      <a routerLink="/admin/products/new" class="rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800">New product</a>
    </div>
    <label class="mb-4 flex max-w-xs flex-col text-sm">Search by name or SKU
      <input type="search" class="rounded-lg border border-gray-400 px-3 py-2" [value]="query()" (input)="query.set($any($event.target).value)" />
    </label>
    @if (actionError(); as message) {
      <p role="alert" class="mb-2 text-rose-700">{{ message }}</p>
    }
    @if (products.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (products.error()) {
      <p role="alert" class="text-rose-700">{{ products.error()?.message }}</p>
    } @else {
      <table class="w-full rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">All products</caption>
        <thead class="bg-gray-100">
          <tr><th scope="col" class="p-3">Name</th><th scope="col" class="p-3">SKU</th><th scope="col" class="p-3">Price</th><th scope="col" class="p-3">Stock</th><th scope="col" class="p-3">Status</th><th scope="col" class="p-3">Actions</th></tr>
        </thead>
        <tbody>
          @for (p of pageItems(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ p.name }}</td>
              <td class="p-3">{{ p.sku }}</td>
              <td class="p-3">{{ p.price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
              <td class="p-3">{{ p.stock }}</td>
              <td class="p-3"><app-status-badge [status]="p.status" /></td>
              <td class="space-x-3 p-3">
                <a [routerLink]="['/admin/products', p.id, 'edit']" class="text-violet-800 underline">Edit</a>
                <button type="button" class="text-violet-800 underline" (click)="togglePublish(p)">{{ p.status === 'active' ? 'Unpublish' : 'Publish' }}</button>
                @if (pendingDelete() === p.id) {
                  <button type="button" class="font-semibold text-rose-700 underline" (click)="remove(p)">Confirm delete</button>
                  <button type="button" class="underline" (click)="pendingDelete.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="text-rose-700 underline" (click)="pendingDelete.set(p.id)">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="p-3">No products found.</td></tr>
          }
        </tbody>
      </table>
      <app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" />
    }
  `,
})
export class Products {
  private readonly repo = inject(ProductRepository);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly products = rxResource({ stream: () => this.repo.findAll() });
  protected readonly actionError = signal('');
  protected readonly pendingDelete = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly page = signal(1);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return (this.products.value() ?? []).filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });
  protected readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    // A new search must restart from the first page.
    effect(() => {
      this.query();
      this.page.set(1);
    });
    // Deleting the last item of the last page must not leave an empty page behind.
    effect(() => {
      const lastPage = Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE));
      if (this.page() > lastPage) this.page.set(lastPage);
    });
  }

  protected togglePublish(product: Product): void {
    const status = product.status === 'active' ? 'draft' : 'active';
    this.repo.update(product.id, { status }).subscribe(this.refreshObserver());
  }

  protected remove(product: Product): void {
    this.pendingDelete.set(null);
    this.repo.delete(product.id).subscribe(this.refreshObserver());
  }

  private refreshObserver() {
    return {
      next: () => {
        this.actionError.set('');
        this.products.reload();
      },
      error: (e: Error) => this.actionError.set(e.message),
    };
  }
}
