import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly exact: boolean;
  readonly icon: string;
  readonly badge?: string;
}

/** Open/Closed: add an admin section by appending to this list. */
const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/admin', exact: true, icon: '📊' },
  { label: 'Orders', path: '/admin/orders', exact: false, icon: '📦', badge: '6' },
  { label: 'Products', path: '/admin/products', exact: false, icon: '🛍️' },
  { label: 'Categories', path: '/admin/categories', exact: false, icon: '🏷️' },
  { label: 'Customers', path: '/admin/customers', exact: false, icon: '👥' },
  { label: 'Inventory', path: '/admin/inventory', exact: false, icon: '📋' },
  { label: 'Coupons', path: '/admin/coupons', exact: false, icon: '🎟️' },
  { label: 'Reports', path: '/admin/reports', exact: false, icon: '📈' },
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-[#f8f9fa] text-gray-900 font-sans">
      <!-- Left Sidebar (Shopcart Forest Green Theme) -->
      <aside class="flex w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-white p-5 shadow-xs">
        <div>
          <!-- Brand Logo matching Storefront -->
          <div class="mb-8 flex items-center justify-between px-2">
            <a routerLink="/admin" class="flex items-center gap-2 text-xl font-black text-[#003d29]">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003d29] text-white text-base shadow-xs" aria-hidden="true">
                🛒
              </span>
              <div class="flex flex-col">
                <span class="leading-none tracking-tight font-black text-lg">Shopcart</span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Admin Portal</span>
              </div>
            </a>
          </div>

          <!-- Nav Items -->
          <nav aria-label="Admin Navigation">
            <ul class="space-y-1">
              @for (item of navItems; track item.path) {
                <li>
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="!bg-[#003d29] !text-white shadow-xs font-bold"
                    [routerLinkActiveOptions]="{ exact: item.exact }"
                    class="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-emerald-50/70 hover:text-[#003d29]"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
                      <span>{{ item.label }}</span>
                    </div>
                    @if (item.badge) {
                      <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#003d29]">
                        {{ item.badge }}
                      </span>
                    }
                  </a>
                </li>
              }
            </ul>
          </nav>
        </div>

        <!-- Sidebar Storefront Card matching Store Theme -->
        <div class="mt-8 space-y-4">
          <div class="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#003d29] text-[10px] text-white font-bold" aria-hidden="true">
                ✨
              </span>
              <p class="text-xs font-bold text-[#003d29]">Storefront Sync</p>
            </div>
            <p class="text-[11px] text-gray-600 leading-snug">
              Live updates are automatically synchronized with the customer catalog.
            </p>
            <a
              routerLink="/store/products"
              class="mt-3 block w-full rounded-full bg-[#003d29] py-2 text-center text-xs font-bold text-white hover:bg-[#002e1f] transition shadow-xs"
            >
              Browse Storefront
            </a>
          </div>

          <a routerLink="/store" class="flex items-center gap-2 px-2 text-xs font-bold text-[#003d29] hover:underline">
            <span aria-hidden="true">←</span>
            <span>Return to Store</span>
          </a>
        </div>
      </aside>

      <!-- Main Layout Body -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Top Utility Bar -->
        <header class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-8 backdrop-blur-md">
          <!-- Search Bar -->
          <div class="relative w-80">
            <input
              type="search"
              placeholder="Search orders, products, inventory..."
              aria-label="Search admin"
              class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#003d29] focus:bg-white focus:outline-none"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" aria-hidden="true">🔍</span>
          </div>

          <!-- Right Admin Profile & Notifications -->
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition"
              aria-label="3 notifications"
            >
              <span class="text-base" aria-hidden="true">🔔</span>
              <span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#003d29] text-[9px] font-bold text-white">
                3
              </span>
            </button>

            <!-- Admin Profile -->
            <div class="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-[#003d29]">
                {{ auth.user()?.name?.slice(0, 1)?.toUpperCase() || 'A' }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-xs font-bold text-gray-900">{{ auth.user()?.name || 'Administrator' }}</p>
                <p class="text-[11px] font-semibold text-emerald-700">Store Manager</p>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Body Content -->
        <main class="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayout {
  protected readonly navItems = NAV_ITEMS;
  protected readonly auth = inject(AuthService);
}
