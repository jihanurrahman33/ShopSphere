export interface ParsedImageUrls {
  readonly urls: string[];
  readonly invalid: string[];
}

/**
 * One URL per line. Only http(s) URLs are accepted, which keeps javascript:/data: URLs
 * out of image sources. Duplicates and blank lines are dropped.
 */
export function parseImageUrls(text: string): ParsedImageUrls {
  const urls = new Set<string>();
  const invalid: string[] = [];
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    if (isHttpUrl(line)) urls.add(line);
    else invalid.push(line);
  }
  return { urls: [...urls], invalid };
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
