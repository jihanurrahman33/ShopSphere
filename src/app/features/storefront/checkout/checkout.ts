import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartFacade } from '../../../core/facades/cart.facade';
import { ShippingAddress } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Checkout</h1>
    @if (cart.items().length === 0) {
      <p>Your cart is empty. <a routerLink="/store/products" class="text-violet-700 underline">Browse products</a></p>
    } @else {
      <div class="grid gap-8 md:grid-cols-2">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
          @if (savedAddresses().length > 0) {
            <label class="flex flex-col text-sm">Use a saved address
              <select class="rounded-lg border border-gray-400 px-3 py-2" (change)="useAddress($any($event.target).value)">
                <option value="">Enter a new address</option>
                @for (a of savedAddresses(); track $index) {
                  <option [value]="$index">{{ a.fullName }} — {{ a.address }}, {{ a.city }}</option>
                }
              </select>
            </label>
          }
          @for (field of fields; track field.name) {
            <label class="flex flex-col text-sm">{{ field.label }}
              <input [type]="field.type" [formControlName]="field.name" [attr.autocomplete]="field.autocomplete" class="rounded-lg border border-gray-400 px-3 py-2" [attr.aria-invalid]="form.controls[field.name].touched && form.controls[field.name].invalid" />
              @if (form.controls[field.name].touched && form.controls[field.name].invalid) {
                <span role="alert" class="text-rose-700">{{ field.error }}</span>
              }
            </label>
          }
          <p class="text-sm text-gray-700">Payment: cash on delivery (simulated).</p>
          @if (error(); as message) {
            <p role="alert" class="text-rose-700">{{ message }}</p>
          }
          <button type="submit" class="rounded-lg bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="busy()">
            {{ busy() ? 'Placing order…' : 'Place order' }}
          </button>
        </form>

        <aside aria-label="Order summary" class="rounded-xl border border-gray-200 bg-white p-4">
          <h2 class="mb-2 font-semibold">Order summary</h2>
          <ul class="space-y-1 text-sm">
            @for (item of cart.items(); track item.productId) {
              <li class="flex justify-between"><span>{{ item.name }} × {{ item.quantity }}</span><span>{{ item.unitPrice * item.quantity | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span></li>
            }
          </ul>
          <p class="mt-3 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{{ cart.total() | currency: 'BDT' : 'symbol-narrow' : '1.0-0' }}</span></p>
        </aside>
      </div>
    }
  `,
})
export class Checkout {
  protected readonly cart = inject(CartFacade);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
  });

  protected readonly fields = [
    { name: 'fullName', label: 'Full name', type: 'text', autocomplete: 'name', error: 'Full name is required.' },
    { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel', error: 'Enter a valid phone number (10–14 digits).' },
    { name: 'address', label: 'Address', type: 'text', autocomplete: 'street-address', error: 'Address is required.' },
    { name: 'city', label: 'City', type: 'text', autocomplete: 'address-level2', error: 'City is required.' },
  ] as const;

  protected readonly savedAddresses = computed<readonly ShippingAddress[]>(() => this.auth.user()?.addresses ?? []);

  protected useAddress(index: string): void {
    const address = this.savedAddresses()[Number(index)];
    if (index !== '' && address) this.form.patchValue(address);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.orders.placeOrder(this.form.getRawValue()).subscribe({
      next: (order) => void this.router.navigate(['/store/orders'], { queryParams: { placed: order.orderNumber } }),
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
