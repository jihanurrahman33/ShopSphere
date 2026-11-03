import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EntityId } from '../models';
import { AuthService } from '../services/auth.service';

/** Facade over the signed-in user's saved products. */
@Injectable({ providedIn: 'root' })
export class WishlistFacade {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _error = signal('');
  readonly error = this._error.asReadonly();
  readonly ids = computed<readonly EntityId[]>(() => this.auth.user()?.wishlist ?? []);

  has(productId: EntityId): boolean {
    return this.ids().includes(productId);
  }

  toggle(productId: EntityId): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/login');
      return;
    }
    const next = this.has(productId) ? this.ids().filter((id) => id !== productId) : [...this.ids(), productId];
    this.auth.updateUser({ wishlist: next }).subscribe({
      next: () => this._error.set(''),
      error: (e: Error) => this._error.set(e.message),
    });
  }
}
