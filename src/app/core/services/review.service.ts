import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';
import { MAX_COMMENT_LENGTH, isValidRating } from '../domain/reviews';
import { Review } from '../models';
import { ReviewRepository } from '../repositories/repositories';
import { AuthService } from './auth.service';

/** Adds a review for the signed-in user; one review per user per product. Client-side checks only. */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly reviews = inject(ReviewRepository);
  private readonly auth = inject(AuthService);

  submit(productId: string, rating: number, comment: string): Observable<Review> {
    const user = this.auth.user();
    const text = comment.trim();
    if (!user) return throwError(() => new Error('Please sign in to write a review.'));
    if (!isValidRating(rating)) return throwError(() => new Error('Choose a rating from 1 to 5.'));
    if (text.length === 0 || text.length > MAX_COMMENT_LENGTH) {
      return throwError(() => new Error(`Write a comment of up to ${MAX_COMMENT_LENGTH} characters.`));
    }
    return this.reviews.findByProductAndUser(productId, user.id).pipe(
      switchMap((existing) =>
        existing.length > 0
          ? throwError(() => new Error('You have already reviewed this product.'))
          : this.reviews.create({
              productId,
              userId: user.id,
              userName: user.name,
              rating,
              comment: text,
              createdAt: new Date().toISOString(),
            }),
      ),
    );
  }
}
