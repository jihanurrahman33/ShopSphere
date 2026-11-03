import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const MIN_PASSWORD_LENGTH = 8;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="mx-auto mt-16 max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 class="mb-4 text-2xl font-bold">Create account</h1>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
        <label class="flex flex-col text-sm">Name
          <input formControlName="name" autocomplete="name" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('name')) { <span role="alert" class="text-rose-700">Name is required.</span> }
        </label>
        <label class="flex flex-col text-sm">Email
          <input type="email" formControlName="email" autocomplete="email" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('email')) { <span role="alert" class="text-rose-700">Enter a valid email.</span> }
        </label>
        <label class="flex flex-col text-sm">Password
          <input type="password" formControlName="password" autocomplete="new-password" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('password')) { <span role="alert" class="text-rose-700">At least {{ minLength }} characters.</span> }
        </label>
        <label class="flex flex-col text-sm">Confirm password
          <input type="password" formControlName="confirm" autocomplete="new-password" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (form.controls.confirm.touched && form.hasError('mismatch')) { <span role="alert" class="text-rose-700">Passwords do not match.</span> }
        </label>
        @if (error(); as message) { <p role="alert" class="text-sm text-rose-700">{{ message }}</p> }
        <button type="submit" class="w-full rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create account' }}</button>
        <p class="text-sm">Already registered? <a routerLink="/login" class="text-violet-700 underline">Sign in</a></p>
      </form>
    </main>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly minLength = MIN_PASSWORD_LENGTH;
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected invalid(name: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.auth.register(name.trim(), email.trim().toLowerCase(), password).subscribe({
      next: () => void this.router.navigateByUrl('/store'),
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
