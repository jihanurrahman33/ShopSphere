import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Coupon, CouponType } from '../../../core/models';
import { CouponRepository } from '../../../core/repositories/repositories';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

const MAX_PERCENT = 100;

/** A percentage coupon cannot exceed 100%. */
function percentInRange(group: AbstractControl): ValidationErrors | null {
  return group.get('type')?.value === 'percentage' && Number(group.get('value')?.value) > MAX_PERCENT
    ? { percentTooHigh: true }
    : null;
}

@Component({
  selector: 'app-admin-coupons',
  imports: [ReactiveFormsModule, DatePipe, StatusBadge],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Coupons</h1>

    <form [formGroup]="form" (ngSubmit)="save()" class="mb-8 grid max-w-xl gap-3 rounded-xl border border-gray-200 bg-white p-4" novalidate>
      <h2 class="font-semibold">{{ editing() ? 'Edit coupon' : 'New coupon' }}</h2>
      <label class="flex flex-col text-sm">Code
        <input formControlName="code" class="rounded-lg border border-gray-400 px-3 py-2 uppercase" />
        @if (form.controls.code.touched && form.controls.code.invalid) { <span role="alert" class="text-rose-700">Code is required.</span> }
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col text-sm">Type
          <select formControlName="type" class="rounded-lg border border-gray-400 px-3 py-2">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label class="flex flex-col text-sm">Value
          <input type="number" min="1" formControlName="value" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (form.controls.value.touched && form.controls.value.invalid) { <span role="alert" class="text-rose-700">Enter a value above 0.</span> }
        </label>
      </div>
      @if (form.touched && form.hasError('percentTooHigh')) { <p role="alert" class="text-rose-700">Percentage cannot exceed 100.</p> }
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col text-sm">Minimum purchase
          <input type="number" min="0" formControlName="minPurchase" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
        <label class="flex flex-col text-sm">Usage limit (optional)
          <input type="number" min="1" formControlName="usageLimit" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
      </div>
      <label class="flex flex-col text-sm">Expiry date (optional)
        <input type="date" formControlName="expiresAt" class="rounded-lg border border-gray-400 px-3 py-2" />
      </label>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="active" /> Active</label>
      @if (message(); as text) { <p role="alert" class="text-rose-700">{{ text }}</p> }
      <div class="flex gap-3">
        <button type="submit" class="rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800">Save</button>
        @if (editing()) { <button type="button" class="rounded-lg border border-gray-400 px-4 py-2" (click)="reset()">Cancel</button> }
      </div>
    </form>

    @if (coupons.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (coupons.error()) {
      <p role="alert" class="text-rose-700">{{ coupons.error()?.message }}</p>
    } @else {
      <table class="w-full max-w-4xl rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">All coupons</caption>
        <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Code</th><th scope="col" class="p-3">Discount</th><th scope="col" class="p-3">Min. purchase</th><th scope="col" class="p-3">Used</th><th scope="col" class="p-3">Expires</th><th scope="col" class="p-3">Status</th><th scope="col" class="p-3">Actions</th></tr></thead>
        <tbody>
          @for (c of coupons.value(); track c.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ c.code }}</td>
              <td class="p-3">{{ c.type === 'percentage' ? c.value + '%' : '৳' + c.value }}</td>
              <td class="p-3">{{ c.minPurchase }}</td>
              <td class="p-3">{{ c.usedCount }}{{ c.usageLimit ? ' / ' + c.usageLimit : '' }}</td>
              <td class="p-3">{{ c.expiresAt ? (c.expiresAt | date: 'mediumDate') : 'Never' }}</td>
              <td class="p-3"><app-status-badge [status]="c.active ? 'active' : 'inactive'" /></td>
              <td class="space-x-3 p-3">
                <button type="button" class="text-violet-800 underline" (click)="edit(c)">Edit</button>
                @if (pendingDelete() === c.id) {
                  <button type="button" class="font-semibold text-rose-700 underline" (click)="remove(c)">Confirm delete</button>
                  <button type="button" class="underline" (click)="pendingDelete.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="text-rose-700 underline" (click)="pendingDelete.set(c.id)">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="p-3">No coupons yet.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class Coupons {
  private readonly repo = inject(CouponRepository);

  protected readonly coupons = rxResource({ stream: () => this.repo.findAll() });
  protected readonly editing = signal<Coupon | null>(null);
  protected readonly pendingDelete = signal<string | null>(null);
  protected readonly message = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      code: ['', Validators.required],
      type: ['percentage' as CouponType],
      value: [10, [Validators.required, Validators.min(1)]],
      minPurchase: [0, [Validators.required, Validators.min(0)]],
      usageLimit: [null as number | null, Validators.min(1)],
      expiresAt: [''],
      active: [true],
    },
    { validators: percentInRange },
  );

  protected edit(coupon: Coupon): void {
    this.editing.set(coupon);
    this.form.setValue({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      usageLimit: coupon.usageLimit ?? null,
      expiresAt: coupon.expiresAt?.slice(0, 10) ?? '',
      active: coupon.active,
    });
  }

  protected reset(): void {
    this.editing.set(null);
    this.form.reset();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { expiresAt, usageLimit, code, ...rest } = this.form.getRawValue();
    const fields = {
      ...rest,
      code: code.trim().toUpperCase(),
      usageLimit: usageLimit ?? null,
      expiresAt: expiresAt ? `${expiresAt}T23:59:59Z` : null,
    };
    const current = this.editing();
    const request: Observable<Coupon> = current
      ? this.repo.update(current.id, fields)
      : this.repo.create({ ...fields, usedCount: 0 });
    this.run(request, () => this.reset());
  }

  protected remove(coupon: Coupon): void {
    this.pendingDelete.set(null);
    this.run(this.repo.delete(coupon.id));
  }

  private run(request: Observable<unknown>, onDone?: () => void): void {
    request.subscribe({
      next: () => {
        this.message.set('');
        onDone?.();
        this.coupons.reload();
      },
      error: (e: Error) => this.message.set(e.message),
    });
  }
}
