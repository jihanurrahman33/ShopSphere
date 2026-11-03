import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { CouponRepository, InventoryRepository, OrderRepository, ProductRepository, UserRepository } from './repositories';

const BASE = 'http://api.test';

describe('repositories', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('BaseRepository maps CRUD to REST verbs and urls', () => {
    const repo = TestBed.inject(ProductRepository);
    repo.findById('7').subscribe();
    expect(http.expectOne(`${BASE}/products/7`).request.method).toBe('GET');

    repo.update('7', { stock: 3 }).subscribe();
    const patch = http.expectOne(`${BASE}/products/7`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ stock: 3 });

    repo.delete('7').subscribe();
    expect(http.expectOne(`${BASE}/products/7`).request.method).toBe('DELETE');
    http.verify();
  });

  it('ProductRepository.findFeatured filters featured active products', () => {
    TestBed.inject(ProductRepository).findFeatured().subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/products`);
    expect(req.request.params.get('featured')).toBe('true');
    expect(req.request.params.get('status')).toBe('active');
  });

  it('OrderRepository.findByCustomer scopes to the customer', () => {
    TestBed.inject(OrderRepository).findByCustomer('u1').subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/orders`).request.params.get('customerId')).toBe('u1');
  });

  it('CouponRepository.findByCode only returns active coupons', () => {
    TestBed.inject(CouponRepository).findByCode('X').subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/coupons`);
    expect(req.request.params.get('code')).toBe('X');
    expect(req.request.params.get('active')).toBe('true');
  });

  it('InventoryRepository.findRecent sorts newest first with a limit', () => {
    TestBed.inject(InventoryRepository).findRecent(20).subscribe();
    const params = http.expectOne((r) => r.url === `${BASE}/inventoryTransactions`).request.params;
    expect([params.get('_sort'), params.get('_order'), params.get('_limit')]).toEqual(['createdAt', 'desc', '20']);
  });

  it('UserRepository.findByEmail queries by email', () => {
    TestBed.inject(UserRepository).findByEmail('a@x.dev').subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/users`).request.params.get('email')).toBe('a@x.dev');
  });
});
