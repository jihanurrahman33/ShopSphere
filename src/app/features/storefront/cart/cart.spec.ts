import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/api.config';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartFacade } from '../../../core/facades/cart.facade';
import { Product } from '../../../core/models';
import { Cart } from './cart';

const product: Product = {
  id: '1', name: 'Headphones', slug: 'h', description: '', price: 1000, images: [],
  categoryId: '1', sku: 'S', stock: 5, status: 'active', featured: false,
};

describe('Cart page', () => {
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

  it('shows an empty state with a link to browse products', () => {
    const fixture = TestBed.createComponent(Cart);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Your cart is empty');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/store/products');
  });

  it('lists items, totals and removes an item', () => {
    const cart = TestBed.inject(CartFacade);
    cart.add(product, 2);
    const fixture = TestBed.createComponent(Cart);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Headphones');
    expect(el.textContent).toContain('Proceed to checkout');

    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Remove')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Your cart is empty');
  });
});
