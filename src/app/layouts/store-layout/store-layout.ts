import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartFacade } from '../../core/facades/cart.facade';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:text-[#003d29] focus:shadow-lg">
      Skip to content
    </a>

    <!-- Top Announcement Utility Bar -->
    <div class="bg-[#003d29] px-4 py-2 text-xs text-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span class="font-medium">+001234567890</span>
        </div>
        <div class="hidden sm:block">
          <span>Get 50% Off on Selected Items</span>
          <span class="mx-2">|</span>
          <a routerLink="/store/products" class="font-bold underline hover:text-emerald-300">Shop Now</a>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1 cursor-pointer hover:text-emerald-300">
            <span>Eng</span>
            <span aria-hidden="true">▾</span>
          </div>
          <div class="flex items-center gap-1 cursor-pointer hover:text-emerald-300">
            <span>Location</span>
            <span aria-hidden="true">▾</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <!-- Logo -->
        <a routerLink="/store" class="flex shrink-0 items-center gap-2 text-2xl font-black tracking-tight text-[#003d29]">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003d29] text-white">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span>ShopSphere</span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-700" aria-label="Main navigation">
          <!-- Categories Dropdown Trigger -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-1 hover:text-[#003d29] focus-visible:outline-2 focus-visible:outline-[#003d29]"
              (click)="toggleCategories()"
              [attr.aria-expanded]="showCategories()"
            >
              <span>Categories</span>
              <svg class="h-4 w-4 transition-transform" [class.rotate-180]="showCategories()" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Popular Categories Dropdown -->
            @if (showCategories()) {
              <div class="absolute left-0 mt-3 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                <p class="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Popular Categories</p>
                <div class="grid grid-cols-2 gap-2">
                  <a routerLink="/store/products" [queryParams]="{ categoryId: '1' }" (click)="showCategories.set(false)" class="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition">
                    <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-xl" aria-hidden="true">🎧</span>
                    <div>
                      <p class="text-sm font-bold text-gray-900">Electronics</p>
                      <p class="text-xs text-gray-400">4 Items</p>
                    </div>
                  </a>
                  <a routerLink="/store/products" [queryParams]="{ categoryId: '2' }" (click)="showCategories.set(false)" class="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition">
                    <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-xl" aria-hidden="true">👕</span>
                    <div>
                      <p class="text-sm font-bold text-gray-900">Fashion</p>
                      <p class="text-xs text-gray-400">3 Items</p>
                    </div>
                  </a>
                  <a routerLink="/store/products" [queryParams]="{ categoryId: '3' }" (click)="showCategories.set(false)" class="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition">
                    <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl" aria-hidden="true">🛋️</span>
                    <div>
                      <p class="text-sm font-bold text-gray-900">Home & Living</p>
                      <p class="text-xs text-gray-400">2 Items</p>
                    </div>
                  </a>
                  <a routerLink="/store/products" [queryParams]="{ categoryId: '4' }" (click)="showCategories.set(false)" class="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition">
                    <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-xl" aria-hidden="true">👟</span>
                    <div>
                      <p class="text-sm font-bold text-gray-900">Sports</p>
                      <p class="text-xs text-gray-400">3 Items</p>
                    </div>
                  </a>
                </div>
              </div>
            }
          </div>

          <a routerLink="/store/products" routerLinkActive="text-[#003d29]" class="hover:text-[#003d29]">Deals</a>
          <a routerLink="/store/products" class="hover:text-[#003d29]">What's New</a>
          <a routerLink="/store" class="hover:text-[#003d29]">Delivery</a>
        </nav>

        <!-- Search Bar with Live Preview -->
        <div class="relative flex-1 max-w-md mx-2">
          <form (submit)="onSearch($event)" class="relative">
            <input
              type="search"
              placeholder="Search Product"
              aria-label="Search Product"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              class="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003d29] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#003d29]"
            />
            <button
              type="submit"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003d29]"
              aria-label="Submit search"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        <!-- Right User Actions -->
        <div class="flex items-center gap-4 text-sm font-semibold text-gray-800">
          @if (auth.isAdmin()) {
            <a routerLink="/admin" class="hidden sm:inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200 hover:bg-amber-100">
              Admin
            </a>
          }

          <!-- Account -->
          @if (auth.user(); as user) {
            <div class="relative">
              <button
                type="button"
                (click)="toggleUserMenu()"
                class="flex items-center gap-1.5 rounded-full p-1.5 hover:bg-gray-100"
                [attr.aria-expanded]="showUserMenu()"
                aria-label="User menu"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-[#003d29]">
                  {{ user.name.slice(0, 1).toUpperCase() }}
                </div>
                <span class="hidden md:inline">{{ user.name }}</span>
                <span class="hidden md:inline text-xs text-gray-400" aria-hidden="true">▾</span>
              </button>

              @if (showUserMenu()) {
                <div class="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  <a routerLink="/store/orders" (click)="showUserMenu.set(false)" class="block px-4 py-2 hover:bg-gray-50 text-sm">My Orders</a>
                  <a routerLink="/store/account" (click)="showUserMenu.set(false)" class="block px-4 py-2 hover:bg-gray-50 text-sm">Account</a>
                  <button type="button" (click)="logout()" class="block w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    Sign Out
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="flex items-center gap-1.5 hover:text-[#003d29]">
              <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="hidden sm:inline">Account</span>
            </a>
          }

          <!-- Cart with Badge -->
          <a routerLink="/store/cart" class="relative flex items-center gap-1.5 rounded-full bg-[#003d29] px-4 py-2 text-white hover:bg-[#002e1f] transition">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="hidden sm:inline">Cart</span>
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-[#003d29]" aria-label="{{ cart.count() }} items">
              {{ cart.count() }}
            </span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main id="main" class="min-h-[calc(100vh-280px)]">
      <router-outlet />
    </main>

    <!-- Full Modern E-Commerce Footer -->
    <footer class="mt-20 border-t border-gray-100 bg-[#f8f9fa] py-14">
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="grid grid-cols-1 gap-10 md:grid-cols-4">
          <!-- Col 1: Brand & Bio -->
          <div>
            <div class="flex items-center gap-2 text-xl font-black text-[#003d29]">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003d29] text-white">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span>ShopSphere</span>
            </div>
            <p class="mt-3 text-sm text-gray-500 leading-relaxed">
              Your one-stop department store for high-fidelity audio, tech, fashion, and home goods with effortless delivery.
            </p>
          </div>

          <!-- Col 2: Department Categories -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900">Department</h4>
            <ul class="mt-4 space-y-2.5 text-sm text-gray-600">
              <li><a routerLink="/store/products" [queryParams]="{ categoryId: '1' }" class="hover:text-[#003d29]">Audio & Electronics</a></li>
              <li><a routerLink="/store/products" [queryParams]="{ categoryId: '2' }" class="hover:text-[#003d29]">Fashion & Apparel</a></li>
              <li><a routerLink="/store/products" [queryParams]="{ categoryId: '3' }" class="hover:text-[#003d29]">Home & Living</a></li>
              <li><a routerLink="/store/products" [queryParams]="{ categoryId: '4' }" class="hover:text-[#003d29]">Fitness & Outdoors</a></li>
            </ul>
          </div>

          <!-- Col 3: Help & Support -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900">Help & Support</h4>
            <ul class="mt-4 space-y-2.5 text-sm text-gray-600">
              <li><a routerLink="/store/orders" class="hover:text-[#003d29]">Track Order</a></li>
              <li><a routerLink="/store/cart" class="hover:text-[#003d29]">Shipping & Delivery</a></li>
              <li><a routerLink="/store" class="hover:text-[#003d29]">Return Policy</a></li>
              <li><a routerLink="/store" class="hover:text-[#003d29]">Frequently Asked Questions</a></li>
            </ul>
          </div>

          <!-- Col 4: Newsletter -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-gray-900">Stay Updated</h4>
            <p class="mt-3 text-sm text-gray-500">Subscribe for weekly deals, coupon alerts, and new arrivals.</p>
            <form (submit)="$event.preventDefault()" class="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                aria-label="Email for newsletter"
                class="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#003d29] focus:outline-none"
              />
              <button
                type="submit"
                class="rounded-full bg-[#003d29] px-4 py-2 text-xs font-bold text-white hover:bg-[#002e1f]"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div class="mt-12 flex flex-col items-center justify-between border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 ShopSphere Inc. All rights reserved.</p>
          <div class="mt-3 flex gap-6 sm:mt-0">
            <a routerLink="/store" class="hover:underline">Privacy Policy</a>
            <a routerLink="/store" class="hover:underline">Terms of Service</a>
            <a routerLink="/store" class="hover:underline">Security</a>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class StoreLayout {
  protected readonly cart = inject(CartFacade);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showCategories = signal(false);
  protected readonly showUserMenu = signal(false);
  protected readonly searchQuery = signal('');

  protected toggleCategories(): void {
    this.showCategories.update((v) => !v);
  }

  protected toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
  }

  protected onSearch(e: Event): void {
    e.preventDefault();
    const query = this.searchQuery().trim();
    if (query) {
      void this.router.navigate(['/store/products'], { queryParams: { q: query } });
    }
  }

  protected logout(): void {
    this.showUserMenu.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/store');
  }
}
