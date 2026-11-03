import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';

/** Presentational component: data in via input(), events out via output(). */
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  template: `
    <article class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-4xl" aria-hidden="true">
        @if (product().images[0]; as src) {
          <img [ngSrc]="src" alt="" fill class="object-cover" />
        } @else {
          🛍️
        }
      </div>
      <h3 class="font-semibold text-gray-900">
        <a [routerLink]="['/store/products', product().id]" class="hover:underline focus-visible:outline-2 focus-visible:outline-violet-700">{{ product().name }}</a>
      </h3>
      <p class="mt-1 flex items-baseline gap-2">
        <span class="text-lg font-bold text-violet-700">{{ (product().discountPrice ?? product().price) | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span>
        @if (product().discountPrice) {
          <s class="text-sm text-gray-600">{{ product().price | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</s>
        }
      </p>
      <button
        type="button"
        class="mt-2 self-start text-sm text-violet-800 underline"
        [attr.aria-pressed]="wishlisted()"
        (click)="wishlistToggle.emit(product())"
      >
        {{ wishlisted() ? '♥ Saved' : '♡ Save for later' }}
      </button>
      <button
        type="button"
        class="mt-auto rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        [disabled]="product().stock === 0"
        (click)="addToCart.emit(product())"
      >
        {{ product().stock === 0 ? 'Out of stock' : 'Add to cart' }}
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
