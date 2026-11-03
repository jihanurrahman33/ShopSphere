import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessibilityViolations } from '../testing/axe';
import { API_BASE_URL } from './core/config/api.config';
import { CartFacade } from './core/facades/cart.facade';
import { Product } from './core/models';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { StoreLayout } from './layouts/store-layout/store-layout';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Cart } from './features/storefront/cart/cart';
import { Checkout } from './features/storefront/checkout/checkout';
import { ProductCard } from './shared/components/product-card/product-card';

const product: Product = {
  id: '1', name: 'Headphones', slug: 'h', description: '', price: 4500, discountPrice: 3999,
  images: [], categoryId: '1', sku: 'S', stock: 3, status: 'active', featured: false,
};

async function audit<T>(component: Type<T>, setup?: (fixture: ReturnType<typeof TestBed.createComponent<T>>) => void) {
  const fixture = TestBed.createComponent(component);
  setup?.(fixture);
  fixture.detectChanges();
  await fixture.whenStable();
  return accessibilityViolations(fixture.nativeElement as HTMLElement);
}

describe('accessibility (axe-core, no colour-contrast)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });
  });

  it('login form', async () => expect(await audit(Login)).toEqual([]));
  it('register form', async () => expect(await audit(Register)).toEqual([]));
  it('store layout', async () => expect(await audit(StoreLayout)).toEqual([]));
  it('admin layout', async () => expect(await audit(AdminLayout)).toEqual([]));
  it('empty cart', async () => expect(await audit(Cart)).toEqual([]));

  it('cart with items', async () => {
    TestBed.inject(CartFacade).add(product, 2);
    expect(await audit(Cart)).toEqual([]);
  });

  it('checkout form', async () => {
    TestBed.inject(CartFacade).add(product);
    expect(await audit(Checkout)).toEqual([]);
  });

  it('product card', async () => {
    expect(await audit(ProductCard, (f) => f.componentRef.setInput('product', product))).toEqual([]);
  });
});
