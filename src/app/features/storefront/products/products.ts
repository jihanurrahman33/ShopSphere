import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
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
    <h1 class="mb-4 text-2xl font-bold">Products</h1>
    <div class="mb-6 flex flex-wrap gap-3">
      <label class="flex flex-col text-sm">Search
        <input type="search" class="rounded-lg border border-gray-400 px-3 py-2" [value]="query()" (input)="query.set($any($event.target).value)" />
      </label>
      <label class="flex flex-col text-sm">Category
        <select class="rounded-lg border border-gray-400 px-3 py-2" (change)="categoryId.set($any($event.target).value)">
          <option value="">All</option>
          @for (c of activeCategories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </label>
      <label class="flex flex-col text-sm">Sort by
        <select class="rounded-lg border border-gray-400 px-3 py-2" (change)="sort.set($any($event.target).value)">
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
    </div>

    @if (products.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (products.error()) {
      <p role="alert" class="text-rose-700">{{ products.error()?.message }}</p>
    } @else {
      <ul class="grid grid-cols-2 gap-4 md:grid-cols-4">
        @for (product of pageItems(); track product.id) {
          <li><app-product-card [product]="product" [wishlisted]="wishlist.has(product.id)" (addToCart)="cart.add($event)" (wishlistToggle)="wishlist.toggle($event.id)" /></li>
        } @empty {
          <li>No products match your filters.</li>
        }
      </ul>
      <app-pagination [total]="visible().length" [pageSize]="pageSize" [(page)]="page" />
    }
  `,
})
export class Products {
  protected readonly cart = inject(CartFacade);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly productRepo = inject(ProductRepository);
  private readonly categoryRepo = inject(CategoryRepository);

  protected readonly products = rxResource({ stream: () => this.productRepo.findAll({ status: 'active' }) });
  protected readonly categories = rxResource({ stream: () => this.categoryRepo.findAll() });

  protected readonly query = signal('');
  protected readonly categoryId = signal('');
  protected readonly sort = signal<SortKey>('newest');
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;

  /** Only active categories are offered as filters. */
  protected readonly activeCategories = computed(() => (this.categories.value() ?? []).filter((c) => c.status === 'active'));

  constructor() {
    // Any filter or sort change restarts from the first page.
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
      .sort(SORTERS[this.sort()]); // filter() already returned a copy; source is not mutated
  });

  protected readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.visible().slice(start, start + PAGE_SIZE);
  });
}
