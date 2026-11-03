import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { WishlistFacade } from '../../../core/facades/wishlist.facade';
import { ShippingAddress, User } from '../../../core/models';
import { ProductRepository } from '../../../core/repositories/repositories';
import { AuthService } from '../../../core/services/auth.service';

const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="mb-4 text-2xl font-bold">My account</h1>
    @if (message(); as text) { <p role="alert" class="mb-4 text-rose-700">{{ text }}</p> }

    <section class="mb-8 max-w-md" aria-labelledby="profile-h">
      <h2 id="profile-h" class="mb-2 font-semibold">Profile</h2>
      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-3" novalidate>
        <p class="text-sm text-gray-700">{{ auth.user()?.email }}</p>
        <label class="flex flex-col text-sm">Name
          <input formControlName="name" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (profileForm.controls.name.touched && profileForm.controls.name.invalid) { <span role="alert" class="text-rose-700">Name is required.</span> }
        </label>
        <button type="submit" class="rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800">Save profile</button>
      </form>
    </section>

    <section class="mb-8" aria-labelledby="address-h">
      <h2 id="address-h" class="mb-2 font-semibold">Address book</h2>
      <ul class="mb-4 grid gap-3 md:grid-cols-2">
        @for (a of addresses(); track $index) {
          <li class="rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <strong>{{ a.fullName }}</strong> · {{ a.phone }}<br />{{ a.address }}, {{ a.city }}
            <button type="button" class="ml-2 text-rose-700 underline" (click)="removeAddress($index)">Remove</button>
          </li>
        } @empty {
          <li class="text-sm">No saved addresses.</li>
        }
      </ul>
      <form [formGroup]="addressForm" (ngSubmit)="addAddress()" class="grid max-w-xl gap-3 md:grid-cols-2" novalidate>
        @for (f of addressFields; track f.name) {
          <label class="flex flex-col text-sm">{{ f.label }}
            <input [formControlName]="f.name" class="rounded-lg border border-gray-400 px-3 py-2" />
            @if (addressForm.controls[f.name].touched && addressForm.controls[f.name].invalid) { <span role="alert" class="text-rose-700">{{ f.error }}</span> }
          </label>
        }
        <button type="submit" class="self-end rounded-lg border border-violet-700 px-4 py-2 text-violet-800">Add address</button>
      </form>
    </section>

    <section aria-labelledby="wish-h">
      <h2 id="wish-h" class="mb-2 font-semibold">Wishlist</h2>
      <ul class="space-y-2 text-sm">
        @for (p of saved(); track p.id) {
          <li class="flex items-center gap-3">
            <a [routerLink]="['/store/products', p.id]" class="text-violet-800 underline">{{ p.name }}</a>
            <button type="button" class="text-rose-700 underline" (click)="wishlist.toggle(p.id)">Remove</button>
          </li>
        } @empty {
          <li>Nothing saved yet.</li>
        }
      </ul>
    </section>
  `,
})
export class Account {
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistFacade);
  private readonly products = inject(ProductRepository);

  protected readonly message = signal('');
  protected readonly addresses = computed<readonly ShippingAddress[]>(() => this.auth.user()?.addresses ?? []);

  private readonly catalog = rxResource({ stream: () => this.products.findAll() });
  protected readonly saved = computed(() => {
    const ids = this.wishlist.ids();
    return (this.catalog.value() ?? []).filter((p) => ids.includes(p.id));
  });

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly profileForm = this.fb.group({ name: [this.auth.user()?.name ?? '', Validators.required] });
  protected readonly addressForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
  });
  protected readonly addressFields = [
    { name: 'fullName', label: 'Full name', error: 'Required.' },
    { name: 'phone', label: 'Phone', error: 'Enter 10–14 digits.' },
    { name: 'address', label: 'Address', error: 'Required.' },
    { name: 'city', label: 'City', error: 'Required.' },
  ] as const;

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.save(this.auth.updateUser({ name: this.profileForm.getRawValue().name.trim() }));
  }

  protected addAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.save(this.auth.updateUser({ addresses: [...this.addresses(), this.addressForm.getRawValue()] }), () =>
      this.addressForm.reset(),
    );
  }

  protected removeAddress(index: number): void {
    this.save(this.auth.updateUser({ addresses: this.addresses().filter((_, i) => i !== index) }));
  }

  private save(request: Observable<User>, onDone?: () => void): void {
    request.subscribe({
      next: () => {
        this.message.set('');
        onDone?.();
      },
      error: (e: Error) => this.message.set(e.message),
    });
  }
}
