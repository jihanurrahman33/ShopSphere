import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('  Wireless Headphones! ')).toBe('wireless-headphones');
  });

  it('strips accents and collapses separators', () => {
    expect(slugify('Café -- Crème')).toBe('cafe-creme');
  });

  it('returns empty string when nothing usable remains', () => {
    expect(slugify('***')).toBe('');
  });
});
