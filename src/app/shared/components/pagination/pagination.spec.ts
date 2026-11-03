import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Pagination } from './pagination';

function render(total: number, pageSize = 10) {
  const fixture = TestBed.createComponent(Pagination);
  fixture.componentRef.setInput('total', total);
  fixture.componentRef.setInput('pageSize', pageSize);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('Pagination', () => {
  it('renders nothing when everything fits on one page', () => {
    expect(render(5).el.querySelector('nav')).toBeNull();
  });

  it('moves between pages and disables the edges', () => {
    const { fixture, el } = render(25);
    const [prev, next] = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
    expect(el.textContent).toContain('Page 1 of 3');
    expect(prev.disabled).toBe(true);

    next.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(2);

    next.click();
    fixture.detectChanges();
    expect(next.disabled).toBe(true);
  });
});
