import { Component, computed, input, model } from '@angular/core';

/** Reusable, presentational pagination. `page` is two-way bound (1-based). */
@Component({
  selector: 'app-pagination',
  template: `
    @if (pageCount() > 1) {
      <nav class="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
        <button
          type="button"
          class="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-5 font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[#003d29] disabled:opacity-40 disabled:cursor-not-allowed"
          [disabled]="page() <= 1"
          (click)="page.set(page() - 1)"
        >
          Previous
        </button>
        <span class="rounded-full bg-emerald-50 px-4 py-2 font-bold text-[#003d29]" aria-live="polite">
          Page {{ page() }} of {{ pageCount() }}
        </span>
        <button
          type="button"
          class="flex h-10 items-center justify-center rounded-full border border-gray-200 bg-white px-5 font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-[#003d29] disabled:opacity-40 disabled:cursor-not-allowed"
          [disabled]="page() >= pageCount()"
          (click)="page.set(page() + 1)"
        >
          Next
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly page = model(1);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
}
