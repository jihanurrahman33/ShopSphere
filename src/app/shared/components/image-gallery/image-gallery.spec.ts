import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { accessibilityViolations } from '../../../../testing/axe';
import { ImageGallery } from './image-gallery';

function render(images: string[]) {
  const fixture = TestBed.createComponent(ImageGallery);
  fixture.componentRef.setInput('images', images);
  fixture.componentRef.setInput('alt', 'Headphones');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const PHOTOS = ['https://img.test/1.jpg', 'https://img.test/2.jpg'];

describe('ImageGallery', () => {
  it('shows an accessible placeholder when there are no photos', () => {
    const { el } = render([]);
    expect(el.querySelector('[role=img]')?.getAttribute('aria-label')).toContain('no photo available');
    expect(el.querySelector('img')).toBeNull();
  });

  it('shows the first photo and switches with the thumbnails', () => {
    const { fixture, el } = render(PHOTOS);
    const main = () => el.querySelector('div img') as HTMLImageElement;
    expect(main().getAttribute('src')).toContain('1.jpg');

    (el.querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(main().getAttribute('src')).toContain('2.jpg');
    expect(el.querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('has no thumbnails for a single photo', () => {
    expect(render([PHOTOS[0]]).el.querySelectorAll('button')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    expect(await accessibilityViolations(render(PHOTOS).el)).toEqual([]);
  });
});
