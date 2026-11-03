import { describe, expect, it } from 'vitest';
import { accessibilityViolations } from './axe';

describe('accessibilityViolations helper', () => {
  it('detects real problems, so a clean result elsewhere is meaningful', async () => {
    const bad = document.createElement('div');
    bad.innerHTML = '<img src="x.png"><input type="text"><button></button>';
    const found = await accessibilityViolations(bad);
    const ids = found.map((f) => f.split(' ')[0]);
    expect(ids).toEqual(expect.arrayContaining(['image-alt', 'label', 'button-name']));
  });

  it('passes accessible markup', async () => {
    const good = document.createElement('div');
    good.innerHTML = '<label>Name <input type="text"></label><button>Save</button>';
    expect(await accessibilityViolations(good)).toEqual([]);
  });
});
