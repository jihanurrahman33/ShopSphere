import { describe, expect, it } from 'vitest';
import { canTransition, nextStatuses, trackingSteps } from './order-workflow';

describe('trackingSteps', () => {
  it('marks earlier steps done, the current one current and the rest upcoming', () => {
    expect(trackingSteps('processing').map((s) => s.state)).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
  });

  it('shows delivered as the final current step', () => {
    expect(trackingSteps('delivered').at(-1)).toEqual({ status: 'delivered', state: 'current' });
  });

  it('has no timeline for cancelled or returned orders', () => {
    expect(trackingSteps('cancelled')).toEqual([]);
    expect(trackingSteps('returned')).toEqual([]);
  });
});

describe('order workflow', () => {
  it('allows the forward path', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });

  it('forbids skipping steps and reviving terminal states', () => {
    expect(canTransition('pending', 'shipped')).toBe(false);
    expect(nextStatuses('cancelled')).toEqual([]);
  });

  it('allows cancelling only before shipping', () => {
    expect(canTransition('processing', 'cancelled')).toBe(true);
    expect(canTransition('shipped', 'cancelled')).toBe(false);
  });
});
