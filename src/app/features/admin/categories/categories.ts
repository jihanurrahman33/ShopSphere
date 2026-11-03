import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { Category } from '../../../core/models';
import { CategoryRepository, ProductRepository } from '../../../core/repositories/repositories';
import { slugify } from '../../../core/utils/slugify';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, StatusBadge],
  template: `
    <h1 class="mb-4 text-2xl font-bold">Categories</h1>

    <form [formGroup]="form" (ngSubmit)="save()" class="mb-8 grid max-w-xl gap-3 rounded-xl border border-gray-200 bg-white p-4" novalidate>
      <h2 class="font-semibold">{{ editing() ? 'Edit category' : 'New category' }}</h2>
      <label class="flex flex-col text-sm">Name
        <input formControlName="name" class="rounded-lg border border-gray-400 px-3 py-2" />
        @if (form.controls.name.touched && form.controls.name.invalid) { <span role="alert" class="text-rose-700">Name is required.</span> }
      </label>
      <label class="flex flex-col text-sm">Parent category
        <select formControlName="parentId" class="rounded-lg border border-gray-400 px-3 py-2">
          <option value="">None (top level)</option>
          @for (c of parentOptions(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
      </label>
      <label class="flex flex-col text-sm">Status
        <select formControlName="status" class="rounded-lg border border-gray-400 px-3 py-2">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      @if (message(); as text) { <p role="alert" class="text-rose-700">{{ text }}</p> }
      <div class="flex items-center gap-3 pt-2">
        <button
          type="submit"
          class="rounded-full bg-[#003d29] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#002e1f] transition cursor-pointer"
        >
          Save Category
        </button>
        @if (editing()) {
          <button
            type="button"
            class="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            (click)="reset()"
          >
            Cancel
          </button>
        }
      </div>
    </form>

    @if (categories.isLoading()) {
      <p role="status">Loading…</p>
    } @else if (categories.error()) {
      <p role="alert" class="text-rose-700">{{ categories.error()?.message }}</p>
    } @else {
      <table class="w-full max-w-3xl rounded-xl border border-gray-200 bg-white text-left text-sm">
        <caption class="sr-only">All categories</caption>
        <thead class="bg-gray-100"><tr><th scope="col" class="p-3">Name</th><th scope="col" class="p-3">Slug</th><th scope="col" class="p-3">Parent</th><th scope="col" class="p-3">Status</th><th scope="col" class="p-3">Actions</th></tr></thead>
        <tbody>
          @for (c of categories.value(); track c.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3 font-medium">{{ c.name }}</td>
              <td class="p-3">{{ c.slug }}</td>
              <td class="p-3">{{ parentName(c) }}</td>
              <td class="p-3"><app-status-badge [status]="c.status" /></td>
              <td class="space-x-3 p-3">
                <button type="button" class="text-[#003d29] font-bold hover:underline cursor-pointer" (click)="edit(c)">Edit</button>
                @if (pendingDelete() === c.id) {
                  <button type="button" class="font-semibold text-rose-700 underline" (click)="remove(c)">Confirm delete</button>
                  <button type="button" class="underline" (click)="pendingDelete.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="text-rose-700 underline" (click)="pendingDelete.set(c.id)">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="p-3">No categories yet.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class Categories {
  private readonly repo = inject(CategoryRepository);
  private readonly products = inject(ProductRepository);

  protected readonly categories = rxResource({ stream: () => this.repo.findAll() });
  protected readonly editing = signal<Category | null>(null);
  protected readonly pendingDelete = signal<string | null>(null);
  protected readonly message = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    parentId: [''],
    status: ['active' as Category['status']],
  });

  /** A category cannot be its own parent. */
  protected readonly parentOptions = computed(() =>
    (this.categories.value() ?? []).filter((c) => c.id !== this.editing()?.id),
  );

  protected parentName(category: Category): string {
    return (this.categories.value() ?? []).find((c) => c.id === category.parentId)?.name ?? '—';
  }

  protected edit(category: Category): void {
    this.editing.set(category);
    this.form.setValue({ name: category.name, parentId: category.parentId ?? '', status: category.status });
  }

  protected reset(): void {
    this.editing.set(null);
    this.form.reset({ name: '', parentId: '', status: 'active' });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, parentId, status } = this.form.getRawValue();
    const base = { name: name.trim(), slug: slugify(name), status, ...(parentId ? { parentId } : {}) };
    const current = this.editing();
    const request: Observable<Category> = current
      ? this.repo.update(current.id, { ...base, parentId: parentId || undefined })
      : this.repo.create(base);
    this.run(request, () => this.reset());
  }

  protected remove(category: Category): void {
    this.pendingDelete.set(null);
    const children = (this.categories.value() ?? []).filter((c) => c.parentId === category.id);
    if (children.length > 0) {
      this.message.set(`"${category.name}" has ${children.length} sub-categor${children.length === 1 ? 'y' : 'ies'}. Move or delete them first.`);
      return;
    }
    const guarded = this.products.findAll({ categoryId: category.id }).pipe(
      switchMap((inUse) =>
        inUse.length > 0
          ? throwError(() => new Error(`"${category.name}" still has ${inUse.length} product(s). Move them first.`))
          : this.repo.delete(category.id),
      ),
      switchMap(() => of(category)),
    );
    this.run(guarded);
  }

  private run(request: Observable<unknown>, onDone?: () => void): void {
    request.subscribe({
      next: () => {
        this.message.set('');
        onDone?.();
        this.categories.reload();
      },
      error: (e: Error) => this.message.set(e.message),
    });
  }
}
