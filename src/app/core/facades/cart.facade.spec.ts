import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../models';
import { CartFacade } from './cart.facade';

const product = (over: Partial<Product> = {}): Product => ({
  id: '1', name: 'Headphones', slug: 'h', description: '', price: 1000, images: [],
  categoryId: '1', sku: 'S', stock: 3, status: 'active', featured: false, ...over,
});

describe('CartFacade', () => {
  let cart: CartFacade;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartFacade);
  });

  it('adds a product using its discount price', () => {
    cart.add(product({ discountPrice: 800 }));
    expect(cart.subtotal()).toBe(800);
    expect(cart.count()).toBe(1);
  });

  it('merges repeat adds and caps quantity at stock', () => {
    cart.add(product(), 2);
    cart.add(product(), 5);
    expect(cart.items()[0].quantity).toBe(3);
  });

  it('removes an item when quantity is set to zero', () => {
    cart.add(product());
    cart.setQuantity('1', 0);
    expect(cart.items()).toHaveLength(0);
  });

  it('computes total with shipping and coupon', () => {
    cart.add(product({ stock: 10 }), 2); // subtotal 2000, shipping 100
    cart.applyCoupon({ id: 'c', code: 'C', type: 'percentage', value: 10, minPurchase: 1000, active: true, usedCount: 0 });
    expect(cart.total()).toBe(2000 - 200 + 100);
  });

  it('never mutates a previously emitted items array', () => {
    cart.add(product({ stock: 10 }));
    const before = cart.items();
    cart.add(product({ stock: 10 }));
    expect(before[0].quantity).toBe(1);
  });
});
