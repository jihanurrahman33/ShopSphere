import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, switchMap, tap, throwError, of } from 'rxjs';
import { User, UserRecord } from '../models';
import { UserRepository } from '../repositories/repositories';
import { StorageService } from './storage.service';

const SESSION_KEY = 'shopsphere.session';

interface Session {
  user: User;
  token: string;
}

/**
 * Mock auth against JSON Server. Frontend guards are UX only;
 * a real backend must enforce authorization itself.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = inject(UserRepository);
  private readonly storage = inject(StorageService);

  private readonly session = signal<Session | null>(this.storage.read<Session | null>(SESSION_KEY, null));

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  login(email: string, password: string): Observable<User> {
    return this.users.findByEmail(email.trim().toLowerCase()).pipe(
      map((found) => found.find((u) => u.password === password)),
      switchMap((record) => (record ? of(record) : throwError(() => new Error('Invalid email or password')))),
      map((record) => this.toSession(record)),
      tap((session) => this.persist(session)),
      map((session) => session.user),
    );
  }

  /** Creates a customer account (never an admin) and signs in. */
  register(name: string, email: string, password: string): Observable<User> {
    return this.users.findByEmail(email).pipe(
      switchMap((found) =>
        found.length > 0
          ? throwError(() => new Error('An account with this email already exists.'))
          : this.users.create({ name, email, password, role: 'customer' }),
      ),
      map((record) => this.toSession(record)),
      tap((session) => this.persist(session)),
      map((session) => session.user),
    );
  }

  /** Saves profile fields for the signed-in user and refreshes the session. */
  updateUser(changes: Partial<Pick<User, 'name' | 'addresses' | 'wishlist'>>): Observable<User> {
    const current = this.session();
    if (!current) return throwError(() => new Error('Please sign in first.'));
    return this.users.update(current.user.id, changes).pipe(
      map((record) => this.toSession(record)),
      tap((session) => this.persist(session)),
      map((session) => session.user),
    );
  }

  logout(): void {
    this.session.set(null);
    this.storage.remove(SESSION_KEY);
  }

  private toSession({ password: _password, ...user }: UserRecord): Session {
    return { user, token: `mock-token-${user.id}` };
  }

  private persist(session: Session): void {
    this.session.set(session);
    this.storage.write(SESSION_KEY, session);
  }
}
