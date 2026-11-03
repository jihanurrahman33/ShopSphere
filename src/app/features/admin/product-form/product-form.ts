import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product, ProductStatus } from '../../../core/models';
import { CategoryRepository, ProductRepository } from '../../../core/repositories/repositories';
import { parseImageUrls } from '../../../core/domain/images';
import { slugify } from '../../../core/utils/slugify';

/** Every non-blank line must be an http(s) URL. */
function imageUrlsValid(control: AbstractControl): ValidationErrors | null {
  const { invalid } = parseImageUrls(String(control.value ?? ''));
  return invalid.length > 0 ? { badImageUrl: invalid[0] } : null;
}

/** Group validator: a discount, when present, must be lower than the price. */
function discountBelowPrice(group: AbstractControl): ValidationErrors | null {
  const price = group.get('price')?.value as number | null;
  const discount = group.get('discountPrice')?.value as number | null;
  return discount != null && price != null && discount >= price ? { discountTooHigh: true } : null;
}

const STATUSES: readonly ProductStatus[] = ['active', 'draft', 'archived'];

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="mb-4 text-2xl font-bold">{{ id() ? 'Edit product' : 'New product' }}</h1>
    @if (existing.error(); as loadError) {
      <p role="alert" class="mb-4 text-rose-700">{{ loadError.message }}</p>
    }
    <form [formGroup]="form" (ngSubmit)="submit()" class="grid max-w-2xl gap-4" novalidate>
      <label class="flex flex-col text-sm">Name
        <input formControlName="name" class="rounded-lg border border-gray-400 px-3 py-2" />
        @if (invalid('name')) { <span role="alert" class="text-rose-700">Name is required.</span> }
      </label>
      <label class="flex flex-col text-sm">Description
        <textarea formControlName="description" rows="4" class="rounded-lg border border-gray-400 px-3 py-2"></textarea>
      </label>
      <label class="flex flex-col text-sm">Category
        <select formControlName="categoryId" class="rounded-lg border border-gray-400 px-3 py-2">
          <option value="">Select…</option>
          @for (c of categories.value() ?? []; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        @if (invalid('categoryId')) { <span role="alert" class="text-rose-700">Choose a category.</span> }
      </label>
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col text-sm">Price
          <input type="number" min="0" formControlName="price" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('price')) { <span role="alert" class="text-rose-700">Enter a price of 0 or more.</span> }
        </label>
        <label class="flex flex-col text-sm">Discount price (optional)
          <input type="number" min="0" formControlName="discountPrice" class="rounded-lg border border-gray-400 px-3 py-2" />
        </label>
      </div>
      @if (form.touched && form.hasError('discountTooHigh')) {
        <p role="alert" class="text-rose-700">Discount price must be lower than price.</p>
      }
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col text-sm">SKU
          <input formControlName="sku" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('sku')) { <span role="alert" class="text-rose-700">SKU is required.</span> }
        </label>
        <label class="flex flex-col text-sm">Stock
          <input type="number" min="0" step="1" formControlName="stock" class="rounded-lg border border-gray-400 px-3 py-2" />
          @if (invalid('stock')) { <span role="alert" class="text-rose-700">Enter a whole number of 0 or more.</span> }
        </label>
      </div>
      <label class="flex flex-col text-sm">Status
        <select formControlName="status" class="rounded-lg border border-gray-400 px-3 py-2 capitalize">
          @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
        </select>
      </label>
      <label class="flex flex-col text-sm">Image URLs (one per line, http or https)
        <textarea formControlName="imageUrls" rows="3" class="rounded-lg border border-gray-400 px-3 py-2"></textarea>
        @if (invalid('imageUrls')) { <span role="alert" class="text-rose-700">Each line must be a valid http(s) URL.</span> }
      </label>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="featured" /> Featured</label>

      @if (error(); as message) { <p role="alert" class="text-rose-700">{{ message }}</p> }
      <div class="flex gap-3">
        <button type="submit" class="rounded-lg bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save product' }}</button>
        <a routerLink="/admin/products" class="rounded-lg border border-gray-400 px-5 py-2">Cancel</a>
      </div>
    </form>
  `,
})
export class ProductForm {
  /** Present on /admin/products/:id/edit; absent when creating. */
  readonly id = input<string>();

  private readonly repo = inject(ProductRepository);
  private readonly router = inject(Router);
  protected readonly categories = rxResource({ stream: () => inject(CategoryRepository).findAll() });
  protected readonly existing = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.repo.findById(params),
  });

  protected readonly statuses = STATUSES;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null as number | null, Validators.min(0)],
      sku: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      status: ['draft' as ProductStatus],
      featured: [false],
      imageUrls: ['', imageUrlsValid],
    },
    { validators: discountBelowPrice },
  );

  constructor() {
    effect(() => {
      const product = this.existing.value();
      if (product) this.form.patchValue({ ...product, imageUrls: product.images.join('\n') });
    });
  }

  protected invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const { discountPrice, imageUrls, ...rest } = value;
    const payload = {
      ...rest,
      images: parseImageUrls(imageUrls).urls,
      ...(discountPrice != null ? { discountPrice } : {}),
      slug: slugify(value.name),
    } satisfies Partial<Product>;

    this.busy.set(true);
    this.error.set('');
    const id = this.id();
    const request = id
      ? this.repo.update(id, { ...payload, discountPrice: discountPrice ?? null })
      : this.repo.create({ ...payload, createdAt: new Date().toISOString() });
    request.subscribe({
      next: () => void this.router.navigateByUrl('/admin/products'),
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
