import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { Product } from '../../../core/models';
import { ProductCard } from './product-card';

const product: Product = {
  id: '1', name: 'Headphones', slug: 'h', description: '', price: 4500, discountPrice: 3999,
  images: [], categoryId: '1', sku: 'S', stock: 3, status: 'active', featured: false,
};

function render(over: Partial<Product> = {}, wishlisted = false) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ProductCard);
  fixture.componentRef.setInput('product', { ...product, ...over });
  fixture.componentRef.setInput('wishlisted', wishlisted);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('ProductCard', () => {
  it('shows the discount price and the struck-through original', () => {
    const { el } = render();
    expect(el.textContent).toContain('3,999');
    expect(el.querySelector('s')?.textContent).toContain('4,500');
  });

  it('emits addToCart when the button is clicked', () => {
    const { fixture, el } = render();
    const emitted: Product[] = [];
    fixture.componentInstance.addToCart.subscribe((p) => emitted.push(p));
    (el.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(emitted).toHaveLength(1);
  });

  it('disables add to cart when out of stock', () => {
    const { el } = render({ stock: 0 });
    const button = el.querySelectorAll('button')[1] as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Out of stock');
  });

  it('exposes wishlist state to assistive tech', () => {
    const { el } = render({}, true);
    expect(el.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  });
});
