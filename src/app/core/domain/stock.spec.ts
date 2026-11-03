import { describe, expect, it } from 'vitest';
import { stockAfter, stockLevel } from './stock';

describe('stockLevel', () => {
  it('classifies out, low and ok', () => {
    expect(stockLevel(0)).toBe('out');
    expect(stockLevel(10)).toBe('low');
    expect(stockLevel(11)).toBe('ok');
  });
});

describe('stockAfter', () => {
  it('applies positive and negative changes', () => {
    expect(stockAfter(5, 3)).toBe(8);
    expect(stockAfter(5, -5)).toBe(0);
  });

  it('rejects changes that go negative, are zero or are fractional', () => {
    expect(stockAfter(5, -6)).toBeNull();
    expect(stockAfter(5, 0)).toBeNull();
    expect(stockAfter(5, 1.5)).toBeNull();
  });
});
