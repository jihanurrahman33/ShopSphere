import { Component, computed, input } from '@angular/core';

const TONES: Readonly<Record<string, string>> = {
  active: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-rose-100 text-rose-800',
  archived: 'bg-slate-200 text-slate-800',
};
const DEFAULT_TONE = 'bg-sky-100 text-sky-800';

@Component({
  selector: 'app-status-badge',
  template: `<span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" [class]="tone()">{{ status() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly tone = computed(() => TONES[this.status()] ?? DEFAULT_TONE);
}
