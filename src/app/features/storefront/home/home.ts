import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartFacade } from '../../../core/facades/cart.facade';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { ProductRepository } from '../../../core/repositories/repositories';
import { Product } from '../../../core/models';
import { ProductCard } from '../../../shared/components/product-card/product-card';

interface CategoryCard {
  readonly title: string;
  readonly image: string;
  readonly categoryId: string;
  readonly bgColor: string;
}

@Component({
  selector: 'app-home',
  imports: [ProductCard, RouterLink],
  template: `
    <div class="space-y-16 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <!-- 1. Hero Banner: Soft Mint/Sage 3D Showcase -->
      <section class="relative overflow-hidden rounded-3xl bg-[#d5ede5] p-8 sm:p-14 lg:p-16">
        <div class="relative z-10 grid items-center gap-10 lg:grid-cols-12">
          <!-- Left Text Content -->
          <div class="lg:col-span-7">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#003d29] leading-[1.12]">
              Shopping And<br />
              Department Store.
            </h1>
            <p class="mt-5 max-w-md text-base sm:text-lg text-emerald-950/80 leading-relaxed font-medium">
              Shopping is a bit of a relaxing hobby for me, which is sometimes troubling for the bank balance.
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a
                routerLink="/store/products"
                class="inline-flex items-center justify-center rounded-full bg-[#003d29] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-[#002e1f] hover:-translate-y-0.5"
              >
                Learn More
              </a>
              <a
                routerLink="/store/products"
                class="inline-flex items-center justify-center rounded-full border-2 border-[#003d29] bg-transparent px-7 py-3 text-base font-bold text-[#003d29] transition hover:bg-[#003d29] hover:text-white"
              >
                Explore Products
              </a>
            </div>
          </div>

          <!-- Right Visual / Product Montage -->
          <div class="relative lg:col-span-5 flex items-center justify-center">
            <div class="relative w-full max-w-md aspect-4/3 rounded-2xl bg-white/40 p-4 shadow-xl backdrop-blur-xs border border-white/60 overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80&auto=format&fit=crop"
                alt="Shopping & Gadgets Collection"
                class="h-full w-full object-cover rounded-xl transition duration-500 group-hover:scale-105"
              />
              <div class="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-3 shadow-md backdrop-blur-md">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Featured Deal</p>
                    <p class="text-sm font-extrabold text-[#003d29]">Premium Audio & Gadgets</p>
                  </div>
                  <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">50% OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Shop Our Top Categories -->
      <section aria-labelledby="top-cat-heading">
        <div class="flex items-center justify-between mb-8">
          <h2 id="top-cat-heading" class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Shop Our Top Categories
          </h2>
          <a routerLink="/store/products" class="text-sm font-bold text-[#003d29] hover:underline flex items-center gap-1">
            See All Categories
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          @for (cat of topCategories; track cat.title) {
            <a
              routerLink="/store/products"
              [queryParams]="{ categoryId: cat.categoryId }"
              class="group flex flex-col items-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-xs transition duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div class="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 mb-3 relative">
                <img
                  [src]="cat.image"
                  [alt]="cat.title"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span class="text-sm font-bold text-gray-800 group-hover:text-[#003d29] text-center">
                {{ cat.title }}
              </span>
            </a>
          }
        </div>
      </section>

      <!-- 3. Promotional Banner: 50% Off Headphones -->
      <section class="overflow-hidden rounded-3xl bg-[#fbf3ea] p-8 sm:p-12 lg:p-14">
        <div class="grid items-center gap-8 md:grid-cols-12">
          <div class="md:col-span-7">
            <span class="inline-block rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 mb-4">
              Limited Time Special
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Grab Upto 50% Off On<br />Selected Headphone
            </h2>
            <p class="mt-4 text-base text-gray-600 max-w-lg">
              Immerse yourself in rich, high-fidelity sound. Explore noise-cancelling over-ear models, gaming headsets, and wireless earbuds.
            </p>
            <div class="mt-7">
              <a
                routerLink="/store/products"
                [queryParams]="{ categoryId: '1' }"
                class="inline-flex items-center justify-center rounded-full bg-[#003d29] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#002e1f] transition"
              >
                Buy Now
              </a>
            </div>
          </div>

          <div class="md:col-span-5 flex justify-center">
            <div class="relative w-72 sm:w-80 aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop"
                alt="Headphones Offer"
                class="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Filter & Sort Bar -->
      <section class="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs" aria-label="Product filters">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Left Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold border transition"
              [class.btn-filter-active]="activeFilter() === 'all'"
              [class.btn-filter-inactive]="activeFilter() !== 'all'"
              (click)="setFilter('all')"
            >
              All Products
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold border transition"
              [class.btn-filter-active]="activeFilter() === '1'"
              [class.btn-filter-inactive]="activeFilter() !== '1'"
              (click)="setFilter('1')"
            >
              Headphones & Audio ▾
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold border transition"
              [class.btn-filter-active]="activeFilter() === '2'"
              [class.btn-filter-inactive]="activeFilter() !== '2'"
              (click)="setFilter('2')"
            >
              Fashion ▾
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold border transition"
              [class.btn-filter-active]="activeFilter() === '3'"
              [class.btn-filter-inactive]="activeFilter() !== '3'"
              (click)="setFilter('3')"
            >
              Home & Living ▾
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold border transition"
              [class.btn-filter-active]="activeFilter() === '4'"
              [class.btn-filter-inactive]="activeFilter() !== '4'"
              (click)="setFilter('4')"
            >
              Fitness & Sports ▾
            </button>
          </div>

          <!-- Right Sort Selector -->
          <div class="flex items-center gap-2">
            <label for="sort-select" class="text-xs font-medium text-gray-500">Sort by:</label>
            <select
              id="sort-select"
              class="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#003d29] focus:outline-none"
              [value]="sortOrder()"
              (change)="sortOrder.set($any($event.target).value)"
            >
              <option value="featured">Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 5. Main Product Showcase ("Headphones For You!" / "Products For You!") -->
      <section aria-labelledby="products-for-you-heading">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 id="products-for-you-heading" class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {{ activeFilter() === '1' ? 'Headphones For You!' : 'Products For You!' }}
            </h2>
            <p class="text-sm text-gray-500 mt-1">Curated picks tailored for quality and everyday convenience</p>
          </div>
          <a routerLink="/store/products" class="text-sm font-bold text-[#003d29] hover:underline">
            View All ({{ filteredProducts().length }})
          </a>
        </div>

        @if (productsResource.isLoading()) {
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="h-80 rounded-2xl bg-gray-100 animate-pulse"></div>
            }
          </div>
        } @else if (productsResource.error()) {
          <p role="alert" class="rounded-xl bg-rose-50 p-4 text-rose-700 font-medium">
            {{ productsResource.error()?.message }}
          </p>
        } @else {
          <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            @for (product of filteredProducts(); track product.id) {
              <li>
                <app-product-card
                  [product]="product"
                  [wishlisted]="wishlist.has(product.id)"
                  (addToCart)="cart.add($event)"
                  (wishlistToggle)="wishlist.toggle($event.id)"
                />
              </li>
            } @empty {
              <li class="col-span-full text-center py-12 text-gray-500">
                No products found matching the selected filter.
              </li>
            }
          </ul>
        }
      </section>

      <!-- 6. Weekly Popular Products -->
      <section class="border-t border-gray-100 pt-12" aria-labelledby="weekly-popular-heading">
        <div class="flex items-center justify-between mb-8">
          <h2 id="weekly-popular-heading" class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Weekly Popular Products
          </h2>
          <a routerLink="/store/products" class="text-sm font-bold text-[#003d29] hover:underline">
            Explore More
          </a>
        </div>

        <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          @for (product of weeklyPopular(); track product.id) {
            <li>
              <app-product-card
                [product]="product"
                [wishlisted]="wishlist.has(product.id)"
                (addToCart)="cart.add($event)"
                (wishlistToggle)="wishlist.toggle($event.id)"
              />
            </li>
          }
        </ul>
      </section>

      <!-- 7. Services To Help You Shop -->
      <section class="border-t border-gray-100 pt-12 pb-6" aria-labelledby="services-heading">
        <h2 id="services-heading" class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
          Services To Help You Shop
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <!-- Service 1: FAQs -->
          <div class="overflow-hidden rounded-2xl bg-[#eef5f3] p-6 shadow-xs flex flex-col justify-between group">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
              <p class="mt-2 text-xs text-gray-600">Updates on safe Shopping and payment protections in our stores.</p>
            </div>
            <div class="mt-6 aspect-4/3 overflow-hidden rounded-xl bg-white shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=600&q=80&auto=format&fit=crop"
                alt="Frequently Asked Questions"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <!-- Service 2: Online Payment -->
          <div class="overflow-hidden rounded-2xl bg-[#fbf6ed] p-6 shadow-xs flex flex-col justify-between group">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Online Payment Process</h3>
              <p class="mt-2 text-xs text-gray-600">End-to-end encrypted checkout with multiple local and global methods.</p>
            </div>
            <div class="mt-6 aspect-4/3 overflow-hidden rounded-xl bg-white shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&auto=format&fit=crop"
                alt="Online Payment Process"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <!-- Service 3: Home Delivery -->
          <div class="overflow-hidden rounded-2xl bg-[#fdede8] p-6 shadow-xs flex flex-col justify-between group">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Home Delivery Options</h3>
              <p class="mt-2 text-xs text-gray-600">Fast doorstep courier tracking and convenient 30-day return policy.</p>
            </div>
            <div class="mt-6 aspect-4/3 overflow-hidden rounded-xl bg-white shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop"
                alt="Home Delivery Options"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class Home {
  protected readonly cart = inject(CartFacade);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly productsRepo = inject(ProductRepository);

  protected readonly activeFilter = signal<string>('all');
  protected readonly sortOrder = signal<string>('featured');

  protected readonly topCategories: readonly CategoryCard[] = [
    { title: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80&auto=format&fit=crop', categoryId: '3', bgColor: '#f5f3ef' },
    { title: 'Hand Bag', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80&auto=format&fit=crop', categoryId: '2', bgColor: '#faf2eb' },
    { title: 'Books', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80&auto=format&fit=crop', categoryId: '1', bgColor: '#edf4f6' },
    { title: 'Tech', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80&auto=format&fit=crop', categoryId: '1', bgColor: '#ebf1f9' },
    { title: 'Sneakers', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80&auto=format&fit=crop', categoryId: '4', bgColor: '#f6eff7' },
    { title: 'Travel', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80&auto=format&fit=crop', categoryId: '2', bgColor: '#eef6f0' },
  ];

  protected readonly productsResource = rxResource({
    stream: () => this.productsRepo.findAll(),
  });

  protected readonly allProducts = computed(() => this.productsResource.value() ?? []);

  protected readonly filteredProducts = computed(() => {
    let list = this.allProducts();
    const filter = this.activeFilter();
    if (filter !== 'all') {
      list = list.filter((p) => p.categoryId === filter);
    }
    const sort = this.sortOrder();
    if (sort === 'low-to-high') {
      list = [...list].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (sort === 'high-to-low') {
      list = [...list].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    }
    return list;
  });

  protected readonly weeklyPopular = computed(() => {
    return this.allProducts().filter((p) => p.featured).slice(0, 4);
  });

  protected setFilter(catId: string): void {
    this.activeFilter.set(catId);
  }
}
