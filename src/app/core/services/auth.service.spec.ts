import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { UserRecord } from '../models';
import { AuthService } from './auth.service';

const BASE = 'http://api.test';
const admin: UserRecord = { id: '1', name: 'Admin', email: 'admin@x.dev', password: 'pw', role: 'admin' };

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE }],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('signs in with matching credentials and never keeps the password', () => {
    auth.login('admin@x.dev', 'pw').subscribe();
    http.expectOne((r) => r.url === `${BASE}/users`).flush([admin]);

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(JSON.stringify(auth.user())).not.toContain('pw');
    expect(localStorage.getItem('shopsphere.session')).not.toContain('"password"');
  });

  it('rejects a wrong password without creating a session', () => {
    let message = '';
    auth.login('admin@x.dev', 'nope').subscribe({ error: (e: Error) => (message = e.message) });
    http.expectOne((r) => r.url === `${BASE}/users`).flush([admin]);

    expect(message).toBe('Invalid email or password');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('registers a customer (never an admin) and signs in', () => {
    auth.register('Sam', 'sam@x.dev', 'password1').subscribe();
    http.expectOne((r) => r.method === 'GET' && r.url === `${BASE}/users`).flush([]);
    const create = http.expectOne((r) => r.method === 'POST');
    expect(create.request.body.role).toBe('customer');
    create.flush({ ...create.request.body, id: '9' });

    expect(auth.user()?.email).toBe('sam@x.dev');
    expect(auth.isAdmin()).toBe(false);
  });

  it('refuses to register an email that already exists', () => {
    let message = '';
    auth.register('Sam', 'admin@x.dev', 'password1').subscribe({ error: (e: Error) => (message = e.message) });
    http.expectOne((r) => r.url === `${BASE}/users`).flush([admin]);

    expect(message).toContain('already exists');
    http.expectNone((r) => r.method === 'POST');
  });

  it('updates the signed-in user and refreshes the session', () => {
    auth.login('admin@x.dev', 'pw').subscribe();
    http.expectOne((r) => r.url === `${BASE}/users`).flush([admin]);

    auth.updateUser({ name: 'Root' }).subscribe();
    const patch = http.expectOne(`${BASE}/users/1`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({ ...admin, name: 'Root' });

    expect(auth.user()?.name).toBe('Root');
  });

  it('fails to update when nobody is signed in', () => {
    let message = '';
    auth.updateUser({ name: 'X' }).subscribe({ error: (e: Error) => (message = e.message) });
    expect(message).toBe('Please sign in first.');
  });

  it('clears the session on logout', () => {
    auth.login('admin@x.dev', 'pw').subscribe();
    http.expectOne((r) => r.url === `${BASE}/users`).flush([admin]);
    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('shopsphere.session')).toBeNull();
  });
});
