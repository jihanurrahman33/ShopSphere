import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { CartFacade } from '../../../core/facades/cart.facade';
import { Product } from '../../../core/models';
import { Checkout } from './checkout';

const product: Product = {
  id: '1', name: 'Headphones', slug: 'h', description: '', price: 1000, images: [], categoryId: '1',
  sku: 'S', stock: 5, status: 'active', featured: false,
};
const HOME = { fullName: 'Sam Rahman', phone: '01712345678', address: '12 Road', city: 'Dhaka' };

function render(addresses: unknown[]) {
  localStorage.setItem('shopsphere.session', JSON.stringify({ user: { id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer', addresses }, token: 't' }));
  TestBed.inject(CartFacade).add(product, 1);
  const fixture = TestBed.createComponent(Checkout);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: 'http://api.test' }],
    });
  });

  it('offers no address picker when none are saved', () => {
    expect(render([]).el.querySelector('select')).toBeNull();
  });

  it('fills the form from a saved address', () => {
    const { fixture, el } = render([HOME]);
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = '0';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const values = Array.from(el.querySelectorAll('form input')).map((i) => (i as HTMLInputElement).value);
    expect(values).toEqual([HOME.fullName, HOME.phone, HOME.address, HOME.city]);
  });

  it('shows validation errors instead of submitting an empty form', () => {
    const { fixture, el } = render([]);
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(el.querySelectorAll('[role=alert]').length).toBeGreaterThanOrEqual(4);
  });
});
