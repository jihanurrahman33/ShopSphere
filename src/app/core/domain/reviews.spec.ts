import { describe, expect, it } from 'vitest';
import { Review } from '../models';
import { isValidRating, ratingSummary } from './reviews';

const review = (rating: number): Review => ({
  id: String(rating), productId: 'p1', userId: 'u1', userName: 'A', rating, comment: 'ok', createdAt: '2026-11-03T00:00:00Z',
});

describe('ratingSummary', () => {
  it('returns zeros when there are no reviews', () => {
    expect(ratingSummary([])).toEqual({ average: 0, count: 0 });
  });

  it('averages to one decimal place', () => {
    expect(ratingSummary([review(5), review(4), review(4)])).toEqual({ average: 4.3, count: 3 });
  });
});

describe('isValidRating', () => {
  it('accepts whole numbers 1–5 only', () => {
    expect([1, 3, 5].every(isValidRating)).toBe(true);
    expect([0, 6, 2.5, NaN].some(isValidRating)).toBe(false);
  });
});
