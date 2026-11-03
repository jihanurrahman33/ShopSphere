import axe from 'axe-core';

/**
 * Runs axe-core on a rendered element and returns readable violation summaries.
 * jsdom has no layout/canvas, so colour-contrast cannot be evaluated here; that
 * rule must be checked in a real browser (Lighthouse / axe DevTools).
 */
export async function accessibilityViolations(element: HTMLElement): Promise<string[]> {
  document.body.appendChild(element);
  try {
    const results = await axe.run(element, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });
    return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes[0]?.html.slice(0, 120)}`);
  } finally {
    element.remove();
  }
}
