import { Component, computed, input, model } from '@angular/core';

/** Reusable, presentational pagination. `page` is two-way bound (1-based). */
@Component({
  selector: 'app-pagination',
  template: `
    @if (pageCount() > 1) {
      <nav class="mt-4 flex items-center gap-3 text-sm" aria-label="Pagination">
        <button type="button" class="rounded border border-gray-400 px-3 py-1 disabled:opacity-50" [disabled]="page() <= 1" (click)="page.set(page() - 1)">Previous</button>
        <span aria-live="polite">Page {{ page() }} of {{ pageCount() }}</span>
        <button type="button" class="rounded border border-gray-400 px-3 py-1 disabled:opacity-50" [disabled]="page() >= pageCount()" (click)="page.set(page() + 1)">Next</button>
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
