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
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <!-- Header -->
      <div class="border-b border-gray-100 pb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-gray-900">My Account</h1>
          <p class="mt-1 text-sm text-gray-500">Manage your profile credentials, saved addresses, and wishlist</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-[#003d29]">
            {{ auth.user()?.name?.slice(0, 1)?.toUpperCase() || 'U' }}
          </div>
          <span class="text-sm font-bold text-gray-800">{{ auth.user()?.name }}</span>
        </div>
      </div>

      @if (message(); as text) {
        <p role="alert" class="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {{ text }}
        </p>
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Profile & Addresses -->
        <div class="lg:col-span-7 space-y-8">
          <!-- 1. Profile Section -->
          <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs" aria-labelledby="profile-h">
            <h2 id="profile-h" class="text-base font-extrabold text-gray-900 mb-4">Personal Profile</h2>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4" novalidate>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 font-medium">
                  {{ auth.user()?.email }}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Full Name</label>
                <input
                  formControlName="name"
                  aria-label="Full name"
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-[#003d29] focus:outline-none"
                />
                @if (profileForm.controls.name.touched && profileForm.controls.name.invalid) {
                  <span role="alert" class="text-xs text-rose-600 font-semibold mt-1 block">Name is required.</span>
                }
              </div>

              <button
                type="submit"
                class="rounded-full bg-[#003d29] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#002e1f] transition"
              >
                Save Profile
              </button>
            </form>
          </section>

          <!-- 2. Address Book Section -->
          <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs" aria-labelledby="address-h">
            <h2 id="address-h" class="text-base font-extrabold text-gray-900 mb-4">Saved Shipping Addresses</h2>

            <!-- Address List -->
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              @for (a of addresses(); track $index) {
                <li class="relative rounded-xl border border-gray-100 bg-[#fbfbfa] p-4 text-xs space-y-1">
                  <p class="font-bold text-gray-900 text-sm">{{ a.fullName }}</p>
                  <p class="text-gray-600 font-medium">{{ a.phone }}</p>
                  <p class="text-gray-500">{{ a.address }}, {{ a.city }}</p>
                  <button
                    type="button"
                    class="mt-2 text-rose-600 font-semibold hover:underline block"
                    (click)="removeAddress($index)"
                  >
                    Remove
                  </button>
                </li>
              } @empty {
                <li class="col-span-full py-4 text-center text-xs text-gray-400">
                  No saved addresses yet.
                </li>
              }
            </ul>

            <!-- Add Address Form -->
            <div class="border-t border-gray-100 pt-5">
              <h3 class="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Add New Address</h3>
              <form [formGroup]="addressForm" (ngSubmit)="addAddress()" class="grid grid-cols-1 sm:grid-cols-2 gap-3" novalidate>
                @for (f of addressFields; track f.name) {
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-600 mb-1">{{ f.label }}</label>
                    <input
                      [formControlName]="f.name"
                      [attr.aria-label]="f.label"
                      class="rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 focus:border-[#003d29] focus:outline-none"
                    />
                    @if (addressForm.controls[f.name].touched && addressForm.controls[f.name].invalid) {
                      <span role="alert" class="text-[11px] text-rose-600 font-medium mt-1">{{ f.error }}</span>
                    }
                  </div>
                }
                <div class="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    class="rounded-full border-2 border-[#003d29] px-6 py-2 text-xs font-bold text-[#003d29] hover:bg-[#003d29] hover:text-white transition"
                  >
                    Add Address
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>

        <!-- Right Column: Wishlist -->
        <div class="lg:col-span-5">
          <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs" aria-labelledby="wish-h">
            <div class="flex items-center justify-between mb-4">
              <h2 id="wish-h" class="text-base font-extrabold text-gray-900">Wishlist</h2>
              <span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#003d29]">
                {{ saved().length }} saved
              </span>
            </div>

            <ul class="divide-y divide-gray-100">
              @for (p of saved(); track p.id) {
                <li class="flex items-center justify-between py-3 text-xs gap-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                      @if (p.images[0]; as src) {
                        <img [src]="src" alt="" class="h-full w-full object-cover" />
                      } @else {
                        <span>🛍️</span>
                      }
                    </div>
                    <div>
                      <a [routerLink]="['/store/products', p.id]" class="font-bold text-gray-900 hover:underline line-clamp-1">
                        {{ p.name }}
                      </a>
                      <p class="text-[11px] text-gray-400">{{ p.price }} BDT</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-rose-600 font-semibold hover:underline shrink-0"
                    (click)="wishlist.toggle(p.id)"
                  >
                    Remove
                  </button>
                </li>
              } @empty {
                <li class="py-8 text-center text-xs text-gray-400">
                  Nothing saved yet. Explore products to save items for later.
                </li>
              }
            </ul>

            <div class="mt-6 border-t border-gray-100 pt-4">
              <a
                routerLink="/store/products"
                class="block w-full text-center rounded-full bg-gray-50 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Browse Catalog
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
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
