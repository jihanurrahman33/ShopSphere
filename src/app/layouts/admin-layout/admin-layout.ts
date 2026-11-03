import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly exact: boolean;
}

/** Open/Closed: add an admin section by appending to this list. */
const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/admin', exact: true },
  { label: 'Products', path: '/admin/products', exact: false },
  { label: 'Categories', path: '/admin/categories', exact: false },
  { label: 'Orders', path: '/admin/orders', exact: false },
  { label: 'Inventory', path: '/admin/inventory', exact: false },
  { label: 'Customers', path: '/admin/customers', exact: false },
  { label: 'Coupons', path: '/admin/coupons', exact: false },
  { label: 'Reports', path: '/admin/reports', exact: false },
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <aside class="w-56 shrink-0 bg-slate-900 p-4 text-slate-100">
        <p class="mb-6 text-lg font-bold">ShopSphere Admin</p>
        <nav aria-label="Admin">
          <ul class="space-y-1">
            @for (item of navItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-violet-700"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                  class="block rounded-lg px-3 py-2 hover:bg-slate-800"
                  >{{ item.label }}</a
                >
              </li>
            }
          </ul>
        </nav>
        <a routerLink="/store" class="mt-8 block text-sm underline">← Back to store</a>
      </aside>
      <main class="flex-1 p-6"><router-outlet /></main>
    </div>
  `,
})
export class AdminLayout {
  protected readonly navItems = NAV_ITEMS;
}
