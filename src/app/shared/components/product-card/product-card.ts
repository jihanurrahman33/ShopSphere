import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';

/** Presentational component: data in via input(), events out via output(). */
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  template: `
    <article class="group relative flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <!-- Wishlist Button (First Button for spec tests) -->
      <button
        type="button"
        class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm backdrop-blur-xs transition hover:scale-110 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-[#003d29]"
        [attr.aria-pressed]="wishlisted()"
        [attr.aria-label]="wishlisted() ? 'Remove from wishlist' : 'Add to wishlist'"
        (click)="wishlistToggle.emit(product())"
      >
        <svg
          class="h-5 w-5 transition-colors"
          [class.fill-rose-500]="wishlisted()"
          [class.text-rose-500]="wishlisted()"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <!-- Image Area -->
      <a [routerLink]="['/store/products', product().id]" class="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#f5f6f8] transition group-hover:bg-[#edf0f3]" aria-hidden="true">
        @if (product().images[0]; as src) {
          <img [ngSrc]="src" alt="" fill class="object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
        } @else {
          <span class="text-4xl">🛍️</span>
        }
      </a>

      <!-- Title & Price Row -->
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-gray-900 group-hover:text-[#003d29] line-clamp-1">
          <a [routerLink]="['/store/products', product().id]" class="focus-visible:outline-2 focus-visible:outline-[#003d29]">
            {{ product().name }}
          </a>
        </h3>
        <span class="shrink-0 font-bold text-gray-900">
          {{ (product().discountPrice ?? product().price) | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}
        </span>
      </div>

      <!-- Description / Tagline -->
      <p class="mt-1 line-clamp-1 text-xs text-gray-500">
        {{ product().description || 'Organic Cotton, fairtrade certified' }}
      </p>

      <!-- Rating Row -->
      <div class="mt-2 flex items-center gap-1.5 text-xs">
        <div class="flex text-emerald-600" aria-label="5 out of 5 stars">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <span class="font-medium text-emerald-700">(121)</span>
        @if (product().discountPrice) {
          <span class="ml-auto text-xs text-gray-400">
            <s>{{ product().price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</s>
          </span>
        }
      </div>

      <!-- Add to Cart Button (Second Button for spec tests) -->
      <button
        type="button"
        class="mt-4 w-full rounded-full border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:border-[#003d29] hover:bg-[#003d29] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003d29] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
        [disabled]="product().stock === 0"
        (click)="addToCart.emit(product())"
      >
        {{ product().stock === 0 ? 'Out of stock' : 'Add to Cart' }}
      </button>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly wishlisted = input(false);
  readonly addToCart = output<Product>();
  readonly wishlistToggle = output<Product>();
}
