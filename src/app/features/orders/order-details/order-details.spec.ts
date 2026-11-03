import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { Order, User } from '../../../core/models';
import { accessibilityViolations } from '../../../../testing/axe';
import { OrderDetails } from './order-details';

const BASE = 'http://api.test';
const order: Order = {
  id: '5', orderNumber: 'SS-5', customerId: 'u1',
  shippingAddress: { fullName: 'Sam Rahman', phone: '0123456789', address: '12 Road', city: 'Dhaka' },
  items: [{ productId: 'p1', productName: 'Headphones', quantity: 2, price: 1000 }],
  subtotal: 2000, shippingCost: 100, discount: 200, total: 1900,
  status: 'shipped', paymentStatus: 'unpaid', createdAt: '2026-11-01T10:00:00Z',
};

function signIn(user: User): void {
  localStorage.setItem('shopsphere.session', JSON.stringify({ user, token: 't' }));
}

async function render() {
  const fixture = TestBed.createComponent(OrderDetails);
  fixture.componentRef.setInput('id', '5');
  fixture.detectChanges();
  TestBed.inject(HttpTestingController).expectOne(`${BASE}/orders/5`).flush(order);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('OrderDetails', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
  });

  it('shows items, totals, address and the current tracking step to the owner', async () => {
    signIn({ id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer' });
    const { el } = await render();
    expect(el.textContent).toContain('Order SS-5');
    expect(el.textContent).toContain('Headphones');
    expect(el.textContent).toContain('Sam Rahman');
    expect(el.querySelector('[aria-current=step]')?.textContent).toContain('shipped');
  });

  it('hides another customer\'s order', async () => {
    signIn({ id: 'u2', name: 'Other', email: 'o@x.dev', role: 'customer' });
    const { el } = await render();
    expect(el.textContent).toContain('Order not found');
    expect(el.textContent).not.toContain('Headphones');
  });

  it('lets an admin view any order', async () => {
    signIn({ id: 'a1', name: 'Admin', email: 'a@x.dev', role: 'admin' });
    expect((await render()).el.textContent).toContain('Order SS-5');
  });

  it('has no axe violations', async () => {
    signIn({ id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer' });
    expect(await accessibilityViolations((await render()).el)).toEqual([]);
  });
});
