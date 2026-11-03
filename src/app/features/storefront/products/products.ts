import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CartFacade } from '../../../core/facades/cart.facade';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { Product } from '../../../core/models';
import { CategoryRepository, ProductRepository } from '../../../core/repositories/repositories';
import { ProductCard } from '../../../shared/components/product-card/product-card';

type SortKey = 'newest' | 'price-asc' | 'price-desc';

const SORTERS: Readonly<Record<SortKey, (a: Product, b: Product) => number>> = {
  newest: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  'price-asc': (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price),
  'price-desc': (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price),
};

@Component({
  selector: 'app-products',
  imports: [ProductCard],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Products</h1>
    <div class="mb-6 flex flex-wrap gap-3">
      <label class="flex flex-col text-sm">Search
        <input type="search" class="rounded-lg border border-gray-400 px-3 py-2" [value]="query()" (input)="query.set($any($event.target).value)" />
      </label>
      <label class="flex flex-col text-sm">Category
        <select class="rounded-lg border border-gray-400 px-3 py-2" (change)="categoryId.set($any($event.target).value)">
          <option value="">All</option>
          @for (c of categories.value() ?? []; track c.id) {
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
        @for (product of visible(); track product.id) {
          <li><app-product-card [product]="product" [wishlisted]="wishlist.has(product.id)" (addToCart)="cart.add($event)" (wishlistToggle)="wishlist.toggle($event.id)" /></li>
        } @empty {
          <li>No products match your filters.</li>
        }
      </ul>
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

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.categoryId();
    return (this.products.value() ?? [])
      .filter((p) => (!category || p.categoryId === category) && p.name.toLowerCase().includes(q))
      .sort(SORTERS[this.sort()]); // filter() already returned a copy; source is not mutated
  });
}
