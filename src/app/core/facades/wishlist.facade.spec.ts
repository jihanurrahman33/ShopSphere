import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../models';
import { AuthService } from '../services/auth.service';
import { WishlistFacade } from './wishlist.facade';

function setup(user: User | null) {
  const current = signal(user);
  const updateUser = vi.fn((changes: Partial<User>) => {
    current.update((u) => (u ? { ...u, ...changes } : u));
    return of(current() as User);
  });
  const navigateByUrl = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: { user: current, isAuthenticated: () => current() !== null, updateUser } },
      { provide: Router, useValue: { navigateByUrl } },
    ],
  });
  return { facade: TestBed.inject(WishlistFacade), updateUser, navigateByUrl };
}

const customer: User = { id: 'u1', name: 'A', email: 'a@x.dev', role: 'customer', wishlist: [] };

describe('WishlistFacade', () => {
  it('adds then removes a product', () => {
    const { facade } = setup(customer);
    facade.toggle('p1');
    expect(facade.has('p1')).toBe(true);
    facade.toggle('p1');
    expect(facade.has('p1')).toBe(false);
  });

  it('sends guests to the login page without saving', () => {
    const { facade, updateUser, navigateByUrl } = setup(null);
    facade.toggle('p1');
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
    expect(updateUser).not.toHaveBeenCalled();
  });
});
