import { Component, computed, input } from '@angular/core';
import { trackingSteps } from '../../../core/domain/order-workflow';
import { OrderStatus } from '../../../core/models';

/** Presentational delivery timeline; cancelled/returned orders show a notice instead. */
@Component({
  selector: 'app-order-timeline',
  template: `
    @if (steps().length > 0) {
      <ol class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Order progress">
        @for (step of steps(); track step.status) {
          <li class="flex items-center gap-2 text-sm" [attr.aria-current]="step.state === 'current' ? 'step' : null">
            <span
              class="inline-flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold"
              [class]="step.state === 'upcoming' ? 'border-gray-400 text-gray-700' : 'border-violet-700 bg-violet-700 text-white'"
              aria-hidden="true"
              >{{ step.state === 'done' ? '✓' : '' }}</span
            >
            <span class="capitalize" [class.font-semibold]="step.state === 'current'">
              {{ step.status }}
              <span class="sr-only">({{ step.state === 'done' ? 'completed' : step.state }})</span>
            </span>
          </li>
        }
      </ol>
    } @else {
      <p role="status" class="rounded-lg bg-rose-100 p-3 text-rose-900 capitalize">This order was {{ status() }}.</p>
    }
  `,
})
export class OrderTimeline {
  readonly status = input.required<OrderStatus>();
  protected readonly steps = computed(() => trackingSteps(this.status()));
}
