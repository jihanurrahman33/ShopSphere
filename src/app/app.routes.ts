import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'store' },
  {
    path: 'store',
    loadComponent: () => import('./layouts/store-layout/store-layout').then((m) => m.StoreLayout),
    children: [
      { path: '', title: 'ShopSphere', loadComponent: () => import('./features/storefront/home/home').then((m) => m.Home) },
      { path: 'products', title: 'Products', loadComponent: () => import('./features/storefront/products/products').then((m) => m.Products) },
      { path: 'products/:id', title: 'Product details', loadComponent: () => import('./features/storefront/product-details/product-details').then((m) => m.ProductDetails) },
      { path: 'cart', title: 'Cart', loadComponent: () => import('./features/storefront/cart/cart').then((m) => m.Cart) },
      { path: 'checkout', title: 'Checkout', canActivate: [authGuard], loadComponent: () => import('./features/storefront/checkout/checkout').then((m) => m.Checkout) },
      { path: 'account', title: 'My account', canActivate: [authGuard], loadComponent: () => import('./features/storefront/account/account').then((m) => m.Account) },
      { path: 'orders', title: 'My orders', canActivate: [authGuard], loadComponent: () => import('./features/storefront/orders/orders').then((m) => m.Orders) },
    ],
  },
  { path: 'login', title: 'Sign in', loadComponent: () => import('./features/auth/login/login').then((m) => m.Login) },
  { path: 'register', title: 'Create account', loadComponent: () => import('./features/auth/register/register').then((m) => m.Register) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', title: 'Dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'products', title: 'Manage products', loadComponent: () => import('./features/admin/products/products').then((m) => m.Products) },
      { path: 'products/new', title: 'New product', loadComponent: () => import('./features/admin/product-form/product-form').then((m) => m.ProductForm) },
      { path: 'products/:id/edit', title: 'Edit product', loadComponent: () => import('./features/admin/product-form/product-form').then((m) => m.ProductForm) },
      { path: 'categories', title: 'Categories', loadComponent: () => import('./features/admin/categories/categories').then((m) => m.Categories) },
      { path: 'inventory', title: 'Inventory', loadComponent: () => import('./features/admin/inventory/inventory').then((m) => m.Inventory) },
      { path: 'customers', title: 'Customers', loadComponent: () => import('./features/admin/customers/customers').then((m) => m.Customers) },
      { path: 'reports', title: 'Reports', loadComponent: () => import('./features/admin/reports/reports').then((m) => m.Reports) },
      { path: 'coupons', title: 'Coupons', loadComponent: () => import('./features/admin/coupons/coupons').then((m) => m.Coupons) },
      { path: 'orders', title: 'Manage orders', loadComponent: () => import('./features/admin/orders/orders').then((m) => m.AdminOrders) },
    ],
  },
  { path: '**', redirectTo: 'store' },
];
