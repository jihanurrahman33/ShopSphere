import { describe, expect, it } from 'vitest';
import { canTransition, nextStatuses } from './order-workflow';

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
