import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessibilityViolations } from '../../../../testing/axe';
import { API_BASE_URL } from '../../../core/config/api.config';
import { Review } from '../../../core/models';
import { ProductReviews } from './product-reviews';

const BASE = 'http://api.test';
const review = (over: Partial<Review>): Review => ({
  id: '1', productId: 'p1', userId: 'u2', userName: 'Alex', rating: 5, comment: 'Loved it', createdAt: '2026-11-01T00:00:00Z', ...over,
});

async function render(reviews: Review[]) {
  const fixture = TestBed.createComponent(ProductReviews);
  fixture.componentRef.setInput('productId', 'p1');
  fixture.detectChanges();
  TestBed.inject(HttpTestingController).expectOne((r) => r.url === `${BASE}/reviews`).flush(reviews);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('ProductReviews', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
  });

  it('shows the average, count and each review', async () => {
    const { el } = await render([review({ id: '1', rating: 5 }), review({ id: '2', rating: 4, userName: 'Jo', comment: 'Good' })]);
    expect(el.textContent).toContain('4.5');
    expect(el.textContent).toContain('2 reviews');
    expect(el.textContent).toContain('Loved it');
    expect(el.textContent).toContain('Jo');
  });

  it('shows an empty state and asks guests to sign in', async () => {
    const { el } = await render([]);
    expect(el.textContent).toContain('No reviews yet');
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/login');
  });

  it('shows the form to signed-in users and blocks an empty comment', async () => {
    localStorage.setItem('shopsphere.session', JSON.stringify({ user: { id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer' }, token: 't' }));
    const { fixture, el } = await render([]);
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(el.textContent).toContain('Please write a comment');
    TestBed.inject(HttpTestingController).expectNone((r) => r.method === 'POST');
  });

  it('renders review text as plain text, not HTML', async () => {
    const { el } = await render([review({ comment: '<img src=x onerror=alert(1)>' })]);
    expect(el.querySelector('li img')).toBeNull();
    expect(el.textContent).toContain('<img src=x');
  });

  it('has no axe violations', async () => {
    expect(await accessibilityViolations((await render([review({})])).el)).toEqual([]);
  });
});
