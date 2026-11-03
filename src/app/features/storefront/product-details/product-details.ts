import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CartFacade } from '../../../core/facades/cart.facade';
import { ProductRepository } from '../../../core/repositories/repositories';
import { ImageGallery } from '../../../shared/components/image-gallery/image-gallery';
import { ProductReviews } from '../product-reviews/product-reviews';

@Component({
  selector: 'app-product-details',
  imports: [CurrencyPipe, ImageGallery, ProductReviews],
  template: `
    @if (product.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (product.error()) {
      <p role="alert" class="text-rose-700">{{ product.error()?.message }}</p>
    } @else if (product.value(); as p) {
      <article class="grid gap-8 md:grid-cols-2">
        <app-image-gallery [images]="p.images" [alt]="p.name" />
        <div>
          <h1 class="text-3xl font-bold">{{ p.name }}</h1>
          <p class="mt-2 text-2xl font-bold text-violet-700">{{ (p.discountPrice ?? p.price) | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</p>
          <p class="mt-4 text-gray-700">{{ p.description }}</p>
          <p class="mt-2 text-sm" [class]="p.stock > 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ p.stock > 0 ? p.stock + ' in stock' : 'Out of stock' }}
          </p>
          <div class="mt-6 flex items-end gap-3">
            <label class="flex flex-col text-sm">Quantity
              <input type="number" min="1" [max]="p.stock" class="w-24 rounded-lg border border-gray-400 px-3 py-2" [value]="quantity()" (input)="quantity.set(+$any($event.target).value || 1)" />
            </label>
            <button type="button" class="rounded-lg bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="p.stock === 0" (click)="cart.add(p, quantity())">
              Add to cart
            </button>
          </div>
        </div>
      </article>
      <app-product-reviews [productId]="p.id" />
    }
  `,
})
export class ProductDetails {
  /** Bound from the :id route param (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly cart = inject(CartFacade);
  private readonly repo = inject(ProductRepository);
  protected readonly quantity = signal(1);
  protected readonly product = rxResource({ params: () => this.id(), stream: ({ params }) => this.repo.findById(params) });
}
