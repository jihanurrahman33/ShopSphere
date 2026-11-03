import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { Product } from '../../../core/models';
import { ProductDetails } from './product-details';

const BASE = 'http://api.test';
const product = (over: Partial<Product> = {}): Product => ({
  id: '1', name: 'Headphones', slug: 'h', description: 'Nice', price: 1000, images: [],
  categoryId: '1', sku: 'S', stock: 5, status: 'active', featured: false, ...over,
});

async function render(p: Product) {
  const fixture = TestBed.createComponent(ProductDetails);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(`${BASE}/products/1`).flush(p);
  // Not whenStable(): the reviews child fires its own request, which keeps the app "unstable".
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  http.match((r) => r.url === `${BASE}/reviews`).forEach((r) => r.flush([]));
  return fixture.nativeElement as HTMLElement;
}

describe('ProductDetails', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
  });

  it('shows an active product with its add-to-cart button', async () => {
    const el = await render(product());
    expect(el.querySelector('h1')?.textContent).toContain('Headphones');
    expect(el.textContent).toContain('Add to cart');
  });

  it.each(['draft', 'archived'] as const)('hides a %s product even when opened by direct link', async (status) => {
    const el = await render(product({ status }));
    expect(el.textContent).toContain('This product is not available');
    expect(el.textContent).not.toContain('Add to cart');
  });
});
