/**
 * Text links use --color-link so each theme can keep its decorative accent while
 * still meeting WCAG 2.1 AA for body-copy contrast against --color-bg.
 * Five theme/mode combinations shipped below 4.5:1 before this test existed
 * (spring/anime/summer/winter light, ukiyoe dark).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const THEMES = ['spring', 'summer', 'autumn', 'winter', 'anime', 'ukiyoe'];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function modeBlocks(css) {
  return [...css.matchAll(/\[data-mode="(light|dark)"\]\s*\{([\s\S]*?)\n\s*\}/g)]
    .map(([, mode, block]) => ({ mode, block }));
}

test('base.css routes anchor colour through --color-link with an accent fallback', () => {
  const css = readFileSync(join(root, 'assets/css/base.css'), 'utf8');
  assert.match(css, /a\s*\{[^}]*color:\s*var\(--color-link,\s*var\(--color-accent\)\)/,
    'anchors must use var(--color-link, var(--color-accent))');
});

test('every theme/mode link colour meets WCAG AA (4.5:1) against its background', () => {
  const offenders = [];
  let checked = 0;

  for (const theme of THEMES) {
    const css = readFileSync(join(root, `assets/css/themes/${theme}.css`), 'utf8');
    const blocks = modeBlocks(css);
    assert.ok(blocks.length >= 2, `${theme}.css: expected a light and a dark block`);

    for (const { mode, block } of blocks) {
      const link = block.match(/--color-link:\s*(#[0-9A-Fa-f]{6})/);
      const bg = block.match(/--color-bg:\s*(#[0-9A-Fa-f]{6})/);
      assert.ok(bg, `${theme}/${mode}: --color-bg must be a 6-digit hex to compute contrast`);

      if (!link) {
        offenders.push(`${theme}/${mode}: --color-link is not defined`);
        continue;
      }
      const ratio = contrast(hexToRgb(link[1]), hexToRgb(bg[1]));
      checked += 1;
      if (ratio < 4.5) {
        offenders.push(`${theme}/${mode}: ${link[1]} on ${bg[1]} = ${ratio.toFixed(2)}:1 (needs 4.5)`);
      }
    }
  }

  assert.deepEqual(offenders, [], `theme link contrast failures:\n${offenders.join('\n')}`);
  assert.ok(checked >= 12, `expected to check 12 theme/mode pairs, checked ${checked}`);
});
