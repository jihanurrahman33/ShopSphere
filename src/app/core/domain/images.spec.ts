import { describe, expect, it } from 'vitest';
import { parseImageUrls } from './images';

describe('parseImageUrls', () => {
  it('keeps unique http(s) urls and ignores blank lines', () => {
    const { urls, invalid } = parseImageUrls('https://a.test/1.jpg\n\n http://a.test/2.jpg \nhttps://a.test/1.jpg');
    expect(urls).toEqual(['https://a.test/1.jpg', 'http://a.test/2.jpg']);
    expect(invalid).toEqual([]);
  });

  it('rejects non-http schemes and garbage', () => {
    const { urls, invalid } = parseImageUrls('javascript:alert(1)\ndata:image/png;base64,AAAA\nnot a url');
    expect(urls).toEqual([]);
    expect(invalid).toHaveLength(3);
  });
});
