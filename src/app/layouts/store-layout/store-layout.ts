import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartFacade } from '../../core/facades/cart.facade';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:p-2">Skip to content</a>
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto flex max-w-6xl items-center justify-between p-4" aria-label="Main">
        <a routerLink="/store" class="text-xl font-bold text-violet-700">ShopSphere</a>
        <ul class="flex items-center gap-5 text-sm font-medium">
          <li><a routerLink="/store/products" routerLinkActive="text-violet-700" class="hover:underline">Products</a></li>
          <li>
            <a routerLink="/store/cart" routerLinkActive="text-violet-700" class="hover:underline">
              Cart <span class="rounded-full bg-violet-700 px-2 py-0.5 text-xs text-white" aria-label="{{ cart.count() }} items">{{ cart.count() }}</span>
            </a>
          </li>
          @if (auth.isAuthenticated()) {
            <li><a routerLink="/store/orders" routerLinkActive="text-violet-700" class="hover:underline">My orders</a></li>
            <li><a routerLink="/store/account" routerLinkActive="text-violet-700" class="hover:underline">Account</a></li>
          }
          @if (auth.isAdmin()) {
            <li><a routerLink="/admin" class="hover:underline">Admin</a></li>
          }
          <li>
            @if (auth.user(); as user) {
              <button type="button" class="hover:underline" (click)="logout()">Sign out ({{ user.name }})</button>
            } @else {
              <a routerLink="/login" class="hover:underline">Sign in</a>
            }
          </li>
        </ul>
      </nav>
    </header>
    <main id="main" class="mx-auto max-w-6xl p-4"><router-outlet /></main>
    <footer class="mt-12 border-t border-gray-200 p-6 text-center text-sm text-gray-600">© ShopSphere</footer>
  `,
})
export class StoreLayout {
  protected readonly cart = inject(CartFacade);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/store');
  }
}
