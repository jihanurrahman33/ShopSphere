import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { CartFacade } from '../facades/cart.facade';
import { Order, Product } from '../models';
import { OrderService } from './order.service';

const BASE = 'http://api.test';
const ADDRESS = { fullName: 'Sam', phone: '0123456789', address: '12 Road', city: 'Dhaka' };

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1', name: 'Headphones', slug: 'h', description: '', price: 1000, images: [], categoryId: '1',
  sku: 'S', stock: 5, status: 'active', featured: false, ...over,
});

const order: Order = {
  id: 'o1', orderNumber: 'SS-1', customerId: 'u1', shippingAddress: ADDRESS,
  items: [{ productId: 'p1', productName: 'Headphones', quantity: 2, price: 1000 }],
  subtotal: 2000, shippingCost: 100, discount: 0, total: 2100,
  status: 'pending', paymentStatus: 'unpaid', createdAt: '2026-11-01T00:00:00Z',
};

describe('OrderService', () => {
  let service: OrderService;
  let cart: CartFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shopsphere.session', JSON.stringify({ user: { id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer' }, token: 't' }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(OrderService);
    cart = TestBed.inject(CartFacade);
    http = TestBed.inject(HttpTestingController);
  });

  function place(latest: Product): string {
    let message = '';
    service.placeOrder(ADDRESS).subscribe({ error: (e: Error) => (message = e.message) });
    http.expectOne(`${BASE}/products/p1`).flush(latest);
    return message;
  }

  describe('placeOrder', () => {
    it('refuses an empty cart', () => {
      let message = '';
      service.placeOrder(ADDRESS).subscribe({ error: (e: Error) => (message = e.message) });
      expect(message).toContain('empty');
    });

    it('refuses an unpublished product and creates no order', () => {
      cart.add(product(), 1);
      expect(place(product({ status: 'draft' }))).toContain('no longer available');
      http.expectNone((r) => r.method === 'POST');
    });

    it('refuses when the price changed and refreshes the cart prices', () => {
      cart.add(product(), 1);
      expect(place(product({ price: 1500 }))).toContain('prices changed');
      expect(cart.items()[0].unitPrice).toBe(1500);
      http.expectNone((r) => r.method === 'POST');
    });

    it('creates the order, updates stock, writes a ledger entry and clears the cart', () => {
      cart.add(product(), 2);
      let placed: Order | undefined;
      service.placeOrder(ADDRESS).subscribe((o) => (placed = o));
      http.expectOne(`${BASE}/products/p1`).flush(product());

      const create = http.expectOne((r) => r.method === 'POST' && r.url === `${BASE}/orders`);
      expect(create.request.body.items[0]).toMatchObject({ productName: 'Headphones', price: 1000, quantity: 2 });
      create.flush({ ...create.request.body, id: 'o9' });

      const stock = http.expectOne((r) => r.method === 'PATCH' && r.url === `${BASE}/products/p1`);
      expect(stock.request.body).toEqual({ stock: 3 });
      stock.flush(product({ stock: 3 }));
      const ledger = http.expectOne((r) => r.method === 'POST' && r.url === `${BASE}/inventoryTransactions`);
      expect(ledger.request.body).toMatchObject({ change: -2, reason: 'sale' });
      ledger.flush({});

      expect(placed?.id).toBe('o9');
      expect(cart.items()).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    it('rejects illegal transitions without calling the API', () => {
      let message = '';
      service.updateStatus(order, 'delivered').subscribe({ error: (e: Error) => (message = e.message) });
      expect(message).toContain('Cannot change');
      http.verify();
    });

    it('does not touch stock for a normal step', () => {
      service.updateStatus(order, 'confirmed').subscribe();
      http.expectOne(`${BASE}/orders/o1`).flush({ ...order, status: 'confirmed' });
      http.verify();
    });

    it('restocks the items when an order is cancelled', () => {
      service.updateStatus(order, 'cancelled').subscribe();
      http.expectOne(`${BASE}/orders/o1`).flush({ ...order, status: 'cancelled' });
      http.expectOne(`${BASE}/products/p1`).flush(product({ stock: 3 }));

      const stock = http.expectOne((r) => r.method === 'PATCH' && r.url === `${BASE}/products/p1`);
      expect(stock.request.body).toEqual({ stock: 5 });
      stock.flush(product({ stock: 5 }));
      const ledger = http.expectOne((r) => r.method === 'POST' && r.url === `${BASE}/inventoryTransactions`);
      expect(ledger.request.body).toMatchObject({ change: 2, reason: 'return', note: 'Order SS-1' });
      ledger.flush({});
    });

    it('still completes when a product was deleted', () => {
      let result: Order | undefined;
      service.updateStatus(order, 'cancelled').subscribe((o) => (result = o));
      http.expectOne(`${BASE}/orders/o1`).flush({ ...order, status: 'cancelled' });
      http.expectOne(`${BASE}/products/p1`).flush('gone', { status: 404, statusText: 'Not Found' });
      expect(result?.status).toBe('cancelled');
    });
  });
});
