import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CartFacade } from '../../../core/facades/cart.facade';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { Product } from '../../../core/models';
import { CategoryRepository, ProductRepository } from '../../../core/repositories/repositories';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ProductCard } from '../../../shared/components/product-card/product-card';

const PAGE_SIZE = 8;

type SortKey = 'newest' | 'price-asc' | 'price-desc';

const SORTERS: Readonly<Record<SortKey, (a: Product, b: Product) => number>> = {
  newest: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  'price-asc': (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price),
  'price-desc': (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price),
};

@Component({
  selector: 'app-products',
  imports: [ProductCard, Pagination],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <!-- Title & Results Count -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
            Explore All Products
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Showing {{ visible().length }} items in stock and ready to ship
          </p>
        </div>

        <!-- Sort Select -->
        <div class="flex items-center gap-2">
          <label for="sort-by-select" class="text-xs font-semibold text-gray-500">Sort by:</label>
          <select
            id="sort-by-select"
            class="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:border-[#003d29] focus:outline-none"
            [value]="sort()"
            (change)="sort.set($any($event.target).value)"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <!-- Search Input -->
        <div class="relative w-full sm:w-72">
          <input
            type="search"
            placeholder="Search within products..."
            aria-label="Search within products"
            class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-4 pr-10 text-xs text-gray-900 focus:border-[#003d29] focus:bg-white focus:outline-none"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" aria-hidden="true">
            🔍
          </span>
        </div>

        <!-- Category Pills -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-xs font-semibold border transition"
            [class.btn-filter-active]="categoryId() === ''"
            [class.btn-filter-inactive]="categoryId() !== ''"
            (click)="categoryId.set('')"
          >
            All Categories
          </button>
          @for (c of activeCategories(); track c.id) {
            <button
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-semibold border transition"
              [class.btn-filter-active]="categoryId() === c.id"
              [class.btn-filter-inactive]="categoryId() !== c.id"
              (click)="categoryId.set(c.id)"
            >
              {{ c.name }}
            </button>
          }
        </div>
      </div>

      <!-- Products Grid -->
      @if (products.isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="h-80 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (products.error()) {
        <p role="alert" class="rounded-xl bg-rose-50 p-4 text-rose-700 font-semibold">
          {{ products.error()?.message }}
        </p>
      } @else {
        <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          @for (product of pageItems(); track product.id) {
            <li>
              <app-product-card
                [product]="product"
                [wishlisted]="wishlist.has(product.id)"
                (addToCart)="cart.add($event)"
                (wishlistToggle)="wishlist.toggle($event.id)"
              />
            </li>
          } @empty {
            <li class="col-span-full rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500">
              No products found matching your search criteria.
            </li>
          }
        </ul>

        <div class="pt-6">
          <app-pagination [total]="visible().length" [pageSize]="pageSize" [(page)]="page" />
        </div>
      }
    </div>
  `,
})
export class Products {
  protected readonly cart = inject(CartFacade);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly productRepo = inject(ProductRepository);
  private readonly categoryRepo = inject(CategoryRepository);
  private readonly route = inject(ActivatedRoute);

  protected readonly products = rxResource({ stream: () => this.productRepo.findAll({ status: 'active' }) });
  protected readonly categories = rxResource({ stream: () => this.categoryRepo.findAll() });

  protected readonly query = signal('');
  protected readonly categoryId = signal('');
  protected readonly sort = signal<SortKey>('newest');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  protected readonly activeCategories = computed(() => (this.categories.value() ?? []).filter((c) => c.status === 'active'));

  constructor() {
    this.route.queryParams.subscribe((params) => {
      this.categoryId.set(params['categoryId'] ?? '');
      this.query.set(params['q'] ?? '');
    });

    effect(() => {
      this.query();
      this.categoryId();
      this.sort();
      this.page.set(1);
    });
  }

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.categoryId();
    return (this.products.value() ?? [])
      .filter((p) => (!category || p.categoryId === category) && p.name.toLowerCase().includes(q))
      .sort(SORTERS[this.sort()]);
  });

  protected readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.visible().slice(start, start + PAGE_SIZE);
  });
}
