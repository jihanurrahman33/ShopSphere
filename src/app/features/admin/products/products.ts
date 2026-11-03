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
    <div class="space-y-6 font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Catalog Management</span>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">Products</h1>
          <p class="text-xs text-gray-500 mt-0.5">Manage product pricing, SKU codes, descriptions, and publish status</p>
        </div>

        <a
          routerLink="/admin/products/new"
          class="inline-flex items-center gap-2 rounded-full bg-[#003d29] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#002e1f] transition cursor-pointer"
        >
          <span>＋ Add New Product</span>
        </a>
      </div>

      <!-- Search & Filters -->
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <label class="flex items-center gap-2 text-xs font-bold text-gray-700 w-full sm:w-80">
          <span class="sr-only">Search products</span>
          <div class="relative w-full">
            <input
              type="search"
              placeholder="Search by name or SKU..."
              class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" aria-hidden="true">🔍</span>
          </div>
        </label>

        <span class="text-xs text-gray-500 font-semibold">
          Showing {{ pageItems().length }} of {{ filtered().length }} products
        </span>
      </div>

      @if (actionError(); as message) {
        <p role="alert" class="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{{ message }}</p>
      }

      @if (products.isLoading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-16 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (products.error()) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">{{ products.error()?.message }}</p>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table class="w-full text-left text-xs">
            <caption class="sr-only">All products</caption>
            <thead class="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" class="py-3.5 px-4">Product Name</th>
                <th scope="col" class="py-3.5 px-4">SKU</th>
                <th scope="col" class="py-3.5 px-4">Price</th>
                <th scope="col" class="py-3.5 px-4">Stock</th>
                <th scope="col" class="py-3.5 px-4">Status</th>
                <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of pageItems(); track p.id) {
                <tr class="hover:bg-gray-50/50 transition">
                  <td class="py-3.5 px-4 font-bold text-gray-900">
                    <div class="flex items-center gap-3">
                      @if (p.images && p.images[0]) {
                        <img [src]="p.images[0]" [alt]="p.name" class="h-10 w-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0" />
                      } @else {
                        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm shrink-0">🛍️</span>
                      }
                      <div>
                        <p class="font-bold text-gray-900">{{ p.name }}</p>
                        @if (p.featured) {
                          <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Featured</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-gray-500">{{ p.sku }}</td>
                  <td class="py-3.5 px-4 font-black text-gray-900">{{ p.price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</td>
                  <td class="py-3.5 px-4 font-semibold text-gray-800">{{ p.stock }}</td>
                  <td class="py-3.5 px-4"><app-status-badge [status]="p.status" /></td>
                  <td class="py-3.5 px-4 text-right space-x-2">
                    <a [routerLink]="['/admin/products', p.id, 'edit']" class="rounded-full border border-gray-300 px-3 py-1 font-bold text-gray-700 hover:bg-gray-50 transition">
                      Edit
                    </a>
                    <button
                      type="button"
                      class="rounded-full border border-[#003d29] px-3 py-1 font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition cursor-pointer"
                      (click)="togglePublish(p)"
                    >
                      {{ p.status === 'active' ? 'Unpublish' : 'Publish' }}
                    </button>
                    @if (pendingDelete() === p.id) {
                      <button type="button" class="font-bold text-rose-700 underline text-xs cursor-pointer" (click)="remove(p)">Confirm delete</button>
                      <button type="button" class="text-gray-500 underline text-xs cursor-pointer" (click)="pendingDelete.set(null)">Cancel</button>
                    } @else {
                      <button type="button" class="text-rose-600 hover:underline text-xs font-semibold cursor-pointer" (click)="pendingDelete.set(p.id)">Delete</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="p-8 text-center text-gray-500">No products found.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pt-4">
          <app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" />
        </div>
      }
    </div>
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
    effect(() => {
      this.query();
      this.page.set(1);
    });
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
    this.repo.delete(product.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.actionError.set('');
        this.products.reload();
      },
      error: (e: Error) => this.actionError.set(e.message),
    });
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
