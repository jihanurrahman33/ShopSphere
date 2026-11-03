import { NgOptimizedImage } from '@angular/common';
import { Component, input, linkedSignal } from '@angular/core';

/** Main image with thumbnails. Falls back to a placeholder when there are no images. */
@Component({
  selector: 'app-image-gallery',
  imports: [NgOptimizedImage],
  template: `
    @if (images().length === 0) {
      <div class="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-8xl" role="img" [attr.aria-label]="alt() + ' (no photo available)'">🛍️</div>
    } @else {
      <div class="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <img [ngSrc]="images()[selected()]" [alt]="alt()" fill priority class="object-cover" />
      </div>
      @if (images().length > 1) {
        <ul class="mt-3 flex gap-2" aria-label="Product photos">
          @for (src of images(); track src; let i = $index) {
            <li>
              <button
                type="button"
                class="relative block size-16 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-violet-700"
                [class]="i === selected() ? 'border-violet-700' : 'border-transparent'"
                [attr.aria-label]="'Show photo ' + (i + 1) + ' of ' + images().length"
                [attr.aria-pressed]="i === selected()"
                (click)="selected.set(i)"
              >
                <img [ngSrc]="src" alt="" fill class="object-cover" />
              </button>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class ImageGallery {
  readonly images = input.required<readonly string[]>();
  readonly alt = input.required<string>();

  /** Resets to the first photo whenever the image list changes. */
  protected readonly selected = linkedSignal<readonly string[], number>({ source: this.images, computation: () => 0 });
}
