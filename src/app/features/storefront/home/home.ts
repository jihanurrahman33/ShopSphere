import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartFacade } from '../../../core/facades/cart.facade';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { ProductRepository } from '../../../core/repositories/repositories';
import { ProductCard } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [ProductCard, RouterLink],
  template: `
    <section class="rounded-2xl bg-violet-700 p-10 text-white">
      <h1 class="text-3xl font-bold">Welcome to ShopSphere</h1>
      <p class="mt-2">Discover great products at fair prices.</p>
      <a routerLink="/store/products" class="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-medium text-violet-800">Shop now</a>
    </section>

    <h2 class="mt-10 mb-4 text-xl font-semibold">Featured products</h2>
    @if (featured.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (featured.error()) {
      <p role="alert" class="text-rose-700">{{ featured.error()?.message }}</p>
    } @else {
      <ul class="grid grid-cols-2 gap-4 md:grid-cols-4">
        @for (product of featured.value(); track product.id) {
          <li><app-product-card [product]="product" [wishlisted]="wishlist.has(product.id)" (addToCart)="cart.add($event)" (wishlistToggle)="wishlist.toggle($event.id)" /></li>
        }
      </ul>
    }
  `,
})
export class Home {
  protected readonly cart = inject(CartFacade);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly products = inject(ProductRepository);
  protected readonly featured = rxResource({ stream: () => this.products.findFeatured() });
}
