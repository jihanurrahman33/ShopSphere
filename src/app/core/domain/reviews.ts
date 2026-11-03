import { Review } from '../models';

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_COMMENT_LENGTH = 1000;

export interface RatingSummary {
  /** Average rounded to one decimal; 0 when there are no reviews. */
  readonly average: number;
  readonly count: number;
}

export function ratingSummary(reviews: readonly Review[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING;
}
