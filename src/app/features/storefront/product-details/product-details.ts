import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CartFacade } from '../../../core/facades/cart.facade';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { ProductRepository } from '../../../core/repositories/repositories';
import { ImageGallery } from '../../../shared/components/image-gallery/image-gallery';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ProductReviews } from '../product-reviews/product-reviews';

interface ColorOption {
  readonly name: string;
  readonly hex: string;
}

@Component({
  selector: 'app-product-details',
  imports: [CurrencyPipe, ImageGallery, ProductReviews, ProductCard, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      @if (product.isLoading()) {
        <div class="grid gap-12 lg:grid-cols-2 animate-pulse">
          <div class="aspect-square rounded-3xl bg-gray-100"></div>
          <div class="space-y-6">
            <div class="h-10 w-3/4 rounded-xl bg-gray-100"></div>
            <div class="h-6 w-1/3 rounded-xl bg-gray-100"></div>
            <div class="h-24 w-full rounded-xl bg-gray-100"></div>
          </div>
        </div>
      } @else if (product.error()) {
        <p role="alert" class="rounded-xl bg-rose-50 p-4 text-rose-700 font-semibold">
          {{ product.error()?.message }}
        </p>
      } @else if (available(); as p) {
        <!-- Breadcrumb Navigation -->
        <nav aria-label="Breadcrumb" class="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-500">
          <a routerLink="/store" class="hover:text-[#003d29]">Store</a>
          <span aria-hidden="true">/</span>
          <a routerLink="/store/products" class="hover:text-[#003d29]">Electronics</a>
          <span aria-hidden="true">/</span>
          <a routerLink="/store/products" class="hover:text-[#003d29]">Audio</a>
          <span aria-hidden="true">/</span>
          <span class="text-gray-900 font-bold">{{ p.name }}</span>
        </nav>

        <!-- Main Product Two-Column Layout -->
        <article class="grid gap-12 lg:grid-cols-12 items-start">
          <!-- Left Column: Image Gallery -->
          <div class="lg:col-span-6">
            <div class="sticky top-24">
              <app-image-gallery [images]="p.images" [alt]="p.name" />
            </div>
          </div>

          <!-- Right Column: Product Info & Actions -->
          <div class="lg:col-span-6 flex flex-col space-y-6">
            <div>
              <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {{ p.name }}
              </h1>
              <p class="mt-2 text-sm sm:text-base text-gray-500 leading-relaxed">
                {{ p.description }}
              </p>

              <!-- Star Rating -->
              <div class="mt-3 flex items-center gap-2 text-sm">
                <div class="flex text-emerald-600" aria-label="5 out of 5 stars">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <span class="font-bold text-emerald-700">(121 reviews)</span>
              </div>
            </div>

            <hr class="border-gray-100" />

            <!-- Price & Financing -->
            <div>
              <div class="flex items-baseline gap-3">
                <span class="text-3xl font-black text-gray-900">
                  {{ (p.discountPrice ?? p.price) | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                </span>
                @if (p.discountPrice) {
                  <span class="text-lg text-gray-400 line-through">
                    {{ p.price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
                  </span>
                }
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Suggested payments with 6 months special 0% financing available
              </p>
            </div>

            <hr class="border-gray-100" />

            <!-- Color Swatches -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                Choose a Color: <span class="text-[#003d29]">{{ selectedColor() }}</span>
              </p>
              <div class="flex items-center gap-3">
                @for (c of colors; track c.name) {
                  <button
                    type="button"
                    (click)="selectedColor.set(c.name)"
                    class="h-8 w-8 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center"
                    [class.ring-2]="selectedColor() === c.name"
                    [class.ring-brand-green]="selectedColor() === c.name"
                    [class.ring-offset-2]="selectedColor() === c.name"
                    [style.backgroundColor]="c.hex"
                    [attr.aria-label]="c.name"
                  ></button>
                }
              </div>
            </div>

            <hr class="border-gray-100" />

            <!-- Quantity Selector & Stock Indicator -->
            <div class="flex items-center gap-6">
              <div class="flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 shadow-2xs">
                <button
                  type="button"
                  (click)="decreaseQty()"
                  [disabled]="quantity() <= 1"
                  class="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span class="w-10 text-center font-bold text-gray-900">{{ quantity() }}</span>
                <button
                  type="button"
                  (click)="increaseQty(p.stock)"
                  [disabled]="quantity() >= p.stock"
                  class="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <!-- Stock Alert -->
              <div>
                @if (p.stock > 0) {
                  <p class="text-xs text-gray-600 font-medium">
                    Only <strong class="text-amber-600 font-bold">{{ p.stock }} items left</strong>! Don't miss it.
                  </p>
                } @else {
                  <p class="text-xs font-bold text-rose-600">Currently out of stock.</p>
                }
              </div>
            </div>

            <!-- Action Buttons: Buy Now & Add to Cart -->
            <div class="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                type="button"
                [disabled]="p.stock === 0"
                (click)="buyNow(p)"
                class="w-full sm:flex-1 rounded-full bg-[#003d29] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#002e1f] transition focus-visible:outline-2 focus-visible:outline-[#003d29] disabled:opacity-50"
              >
                Buy Now
              </button>

              <button
                type="button"
                [disabled]="p.stock === 0"
                (click)="cart.add(p, quantity())"
                class="w-full sm:flex-1 rounded-full border-2 border-[#003d29] bg-white py-3.5 text-sm font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition focus-visible:outline-2 focus-visible:outline-[#003d29] disabled:opacity-50"
              >
                {{ p.stock === 0 ? 'Out of stock' : 'Add to cart' }}
              </button>
            </div>

            <!-- Value Proposition: Delivery & Returns -->
            <div class="rounded-2xl border border-gray-100 bg-[#f9fafb] p-4 space-y-4">
              <div class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-base" aria-hidden="true">
                  🚚
                </span>
                <div>
                  <h4 class="text-xs font-bold text-gray-900">Free Delivery</h4>
                  <p class="text-xs text-gray-500 mt-0.5">Enter your postal code for instant delivery availability.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-base" aria-hidden="true">
                  📦
                </span>
                <div>
                  <h4 class="text-xs font-bold text-gray-900">Return Delivery</h4>
                  <p class="text-xs text-gray-500 mt-0.5">Free 30-day hassle-free returns. Easy self-service portal.</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- Specifications Table Section -->
        <section class="mt-16 rounded-3xl border border-gray-100 bg-white p-6 sm:p-10 shadow-xs" aria-labelledby="specs-heading">
          <h2 id="specs-heading" class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Product Specifications
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 class="font-bold text-gray-700 uppercase tracking-wide text-xs mb-3">General Information</h3>
              <dl class="divide-y divide-gray-100">
                <div class="flex justify-between py-2"><dt class="text-gray-500">Brand</dt><dd class="font-medium text-gray-900">ShopSphere Signature</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">SKU</dt><dd class="font-medium text-gray-900">{{ p.sku }}</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">Release Date</dt><dd class="font-medium text-gray-900">October 2026</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">Connectivity</dt><dd class="font-medium text-gray-900">Bluetooth 5.3 + USB-C</dd></div>
              </dl>
            </div>
            <div>
              <h3 class="font-bold text-gray-700 uppercase tracking-wide text-xs mb-3">Product Details</h3>
              <dl class="divide-y divide-gray-100">
                <div class="flex justify-between py-2"><dt class="text-gray-500">Microphone</dt><dd class="font-medium text-gray-900">Dual Beamforming</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">Battery Life</dt><dd class="font-medium text-gray-900">Up to 30 Hours</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">Water Resistance</dt><dd class="font-medium text-gray-900">IPX4 Splash Resistant</dd></div>
                <div class="flex justify-between py-2"><dt class="text-gray-500">Warranty</dt><dd class="font-medium text-gray-900">1 Year Official</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <!-- Similar Items You Might Like -->
        <section class="mt-16" aria-labelledby="similar-heading">
          <div class="flex items-center justify-between mb-8">
            <h2 id="similar-heading" class="text-2xl font-bold text-gray-900">
              Similar Items You Might Like
            </h2>
            <a routerLink="/store/products" class="text-sm font-bold text-[#003d29] hover:underline">
              Explore More
            </a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (item of similarProducts(); track item.id) {
              <app-product-card
                [product]="item"
                [wishlisted]="wishlist.has(item.id)"
                (addToCart)="cart.add($event)"
                (wishlistToggle)="wishlist.toggle($event.id)"
              />
            }
          </div>
        </section>

        <!-- Reviews Section -->
        <section class="mt-16">
          <app-product-reviews [productId]="p.id" />
        </section>
      } @else {
        <p role="alert" class="rounded-xl bg-rose-50 p-6 text-rose-700 font-bold text-center">
          This product is not available.
        </p>
      }
    </div>
  `,
})
export class ProductDetails {
  readonly id = input.required<string>();

  protected readonly cart = inject(CartFacade);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly repo = inject(ProductRepository);
  private readonly router = inject(Router);

  protected readonly quantity = signal(1);
  protected readonly selectedColor = signal('Coral Pink');

  protected readonly colors: readonly ColorOption[] = [
    { name: 'Coral Pink', hex: '#f87171' },
    { name: 'Space Gray', hex: '#374151' },
    { name: 'Sage Green', hex: '#a7f3d0' },
    { name: 'Silver Mist', hex: '#e5e7eb' },
    { name: 'Midnight Navy', hex: '#1e3a8a' },
  ];

  protected readonly available = computed(() => {
    const p = this.product.value();
    return p?.status === 'active' ? p : undefined;
  });

  protected readonly product = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.repo.findById(params),
  });

  protected readonly allProducts = rxResource({
    stream: () => this.repo.findAll(),
  });

  protected readonly similarProducts = computed(() => {
    const currentId = this.id();
    return (this.allProducts.value() ?? []).filter((p) => p.id !== currentId).slice(0, 4);
  });

  protected increaseQty(maxStock: number): void {
    if (this.quantity() < maxStock) {
      this.quantity.update((q) => q + 1);
    }
  }

  protected decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  protected buyNow(product: any): void {
    this.cart.add(product, this.quantity());
    void this.router.navigateByUrl('/store/checkout');
  }
}
