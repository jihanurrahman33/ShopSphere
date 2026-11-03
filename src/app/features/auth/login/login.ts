import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const DEFAULT_RETURN_URL = '/store';

/** Only in-app absolute paths are allowed as a post-login target (no `//host` or full URLs). */
function safeReturnUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? url : DEFAULT_RETURN_URL;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="mx-auto mt-16 max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 class="mb-4 text-2xl font-bold">Sign in</h1>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <label class="flex flex-col text-sm">Email
          <input type="email" formControlName="email" autocomplete="email" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
        <label class="flex flex-col text-sm">Password
          <input type="password" formControlName="password" autocomplete="current-password" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
        @if (error(); as message) {
          <p role="alert" class="text-sm text-rose-700">{{ message }}</p>
        }
        <button type="submit" class="w-full rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="form.invalid || busy()">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
        <p class="text-sm">New here? <a routerLink="/register" class="text-violet-700 underline">Create an account</a></p>
      </form>
    </main>
  `,
})
export class Login {
  /** Optional ?returnUrl= query param (withComponentInputBinding). */
  readonly returnUrl = input<string>('/store');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
