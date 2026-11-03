import { OrderStatus } from '../models';

/**
 * State pattern (table-driven): which status changes are legal.
 * Cancel/return are branches, not mandatory steps.
 */
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export type StepState = 'done' | 'current' | 'upcoming';

export interface TrackingStep {
  readonly status: OrderStatus;
  readonly state: StepState;
}

const HAPPY_PATH: readonly OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

/** Timeline for the normal delivery path. Cancelled/returned orders are off-path and return []. */
export function trackingSteps(status: OrderStatus): TrackingStep[] {
  const current = HAPPY_PATH.indexOf(status);
  if (current === -1) return [];
  return HAPPY_PATH.map((step, index) => ({
    status: step,
    state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
  }));
}

export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
