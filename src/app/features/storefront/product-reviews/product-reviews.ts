import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MAX_COMMENT_LENGTH, MAX_RATING, ratingSummary } from '../../../core/domain/reviews';
import { ReviewRepository } from '../../../core/repositories/repositories';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';

const RATING_OPTIONS = Array.from({ length: MAX_RATING }, (_, i) => MAX_RATING - i);

@Component({
  selector: 'app-product-reviews',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section aria-labelledby="reviews-h" class="mt-10">
      <h2 id="reviews-h" class="text-xl font-semibold">Reviews</h2>
      @if (summary().count > 0) {
        <p class="mt-1" aria-label="Average rating {{ summary().average }} out of 5 from {{ summary().count }} reviews">
          <strong>{{ summary().average }}</strong> / 5 · {{ summary().count }} review{{ summary().count === 1 ? '' : 's' }}
        </p>
      } @else {
        <p class="mt-1 text-gray-700">No reviews yet.</p>
      }

      @if (reviews.error()) {
        <p role="alert" class="mt-2 text-rose-700">{{ reviews.error()?.message }}</p>
      }

      <ul class="mt-4 space-y-4">
        @for (r of reviews.value(); track r.id) {
          <li class="rounded-xl border border-gray-200 bg-white p-4">
            <p class="font-medium">{{ r.userName }} <span class="font-normal text-gray-700">· {{ r.rating }}/5 · {{ r.createdAt | date: 'mediumDate' }}</span></p>
            <p class="mt-1 whitespace-pre-line text-sm">{{ r.comment }}</p>
          </li>
        }
      </ul>

      @if (auth.isAuthenticated()) {
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 grid max-w-xl gap-3" novalidate>
          <h3 class="font-semibold">Write a review</h3>
          <label class="flex flex-col text-sm">Rating
            <select formControlName="rating" class="w-32 rounded-lg border border-gray-400 px-3 py-2">
              @for (n of ratingOptions; track n) { <option [ngValue]="n">{{ n }} star{{ n === 1 ? '' : 's' }}</option> }
            </select>
          </label>
          <label class="flex flex-col text-sm">Comment
            <textarea formControlName="comment" rows="3" [attr.maxlength]="maxLength" class="rounded-lg border border-gray-400 px-3 py-2"></textarea>
            @if (form.controls.comment.touched && form.controls.comment.invalid) { <span role="alert" class="text-rose-700">Please write a comment.</span> }
          </label>
          @if (message(); as text) { <p role="alert" class="text-rose-700">{{ text }}</p> }
          <button type="submit" class="self-start rounded-lg bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800 disabled:bg-gray-400" [disabled]="busy()">Submit review</button>
        </form>
      } @else {
        <p class="mt-6 text-sm"><a routerLink="/login" class="text-violet-800 underline">Sign in</a> to write a review.</p>
      }
    </section>
  `,
})
export class ProductReviews {
  readonly productId = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly repo = inject(ReviewRepository);
  private readonly service = inject(ReviewService);

  protected readonly ratingOptions = RATING_OPTIONS;
  protected readonly maxLength = MAX_COMMENT_LENGTH;
  protected readonly busy = signal(false);
  protected readonly message = signal('');

  protected readonly reviews = rxResource({ params: () => this.productId(), stream: ({ params }) => this.repo.findByProduct(params) });
  protected readonly summary = computed(() => ratingSummary(this.reviews.value() ?? []));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    rating: [MAX_RATING],
    comment: ['', [Validators.required, Validators.maxLength(MAX_COMMENT_LENGTH)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { rating, comment } = this.form.getRawValue();
    this.busy.set(true);
    this.message.set('');
    this.service.submit(this.productId(), rating, comment).subscribe({
      next: () => {
        this.busy.set(false);
        this.form.reset({ rating: MAX_RATING, comment: '' });
        this.reviews.reload();
      },
      error: (e: Error) => {
        this.busy.set(false);
        this.message.set(e.message);
      },
    });
  }
}
