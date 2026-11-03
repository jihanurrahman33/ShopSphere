import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { ReviewService } from './review.service';

const BASE = 'http://api.test';

function signIn(): void {
  localStorage.setItem('shopsphere.session', JSON.stringify({ user: { id: 'u1', name: 'Sam', email: 's@x.dev', role: 'customer' }, token: 't' }));
}

describe('ReviewService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
  });

  function errorOf(promise: () => import('rxjs').Observable<unknown>): string {
    let message = '';
    promise().subscribe({ error: (e: Error) => (message = e.message) });
    return message;
  }

  it('requires sign-in', () => {
    const service = TestBed.inject(ReviewService);
    expect(errorOf(() => service.submit('p1', 5, 'Great'))).toContain('sign in');
  });

  it('rejects bad ratings and empty or oversized comments without calling the API', () => {
    signIn();
    const service = TestBed.inject(ReviewService);
    expect(errorOf(() => service.submit('p1', 6, 'Great'))).toContain('rating');
    expect(errorOf(() => service.submit('p1', 3, '   '))).toContain('comment');
    expect(errorOf(() => service.submit('p1', 3, 'x'.repeat(1001)))).toContain('comment');
    TestBed.inject(HttpTestingController).verify();
  });

  it('creates a review once per user per product', () => {
    signIn();
    const service = TestBed.inject(ReviewService);
    const http = TestBed.inject(HttpTestingController);

    service.submit('p1', 4, '  Nice  ').subscribe();
    http.expectOne((r) => r.method === 'GET' && r.url === `${BASE}/reviews`).flush([]);
    const create = http.expectOne((r) => r.method === 'POST');
    expect(create.request.body).toMatchObject({ productId: 'p1', userId: 'u1', userName: 'Sam', rating: 4, comment: 'Nice' });

  });

  it('refuses a second review of the same product', () => {
    signIn();
    const service = TestBed.inject(ReviewService);
    const http = TestBed.inject(HttpTestingController);

    let message = '';
    service.submit('p1', 5, 'Again').subscribe({ error: (e: Error) => (message = e.message) });
    http.expectOne((r) => r.method === 'GET' && r.url === `${BASE}/reviews`).flush([{ id: '1' }]);

    expect(message).toContain('already reviewed');
    http.expectNone((r) => r.method === 'POST');
  });
});
