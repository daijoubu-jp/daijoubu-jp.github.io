/**
 * Guards the full-screen stroke view against viewport-based sizing.
 *
 * The modal stroke view lives inside a grid column (~430px wide) of a
 * max-width: 960px dialog. Sizing it with vw/vh made it overflow its column
 * and overlap the readings panel, so its width must stay container-relative.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(
  fileURLToPath(new URL('../browse/kanji.html', import.meta.url)),
  'utf8'
);

test('stroke modal view width is container-relative, not viewport-relative', () => {
  const match = html.match(/id="stroke-modal-view"[^>]*style="([^"]*)"/);
  assert.ok(match, 'stroke-modal-view element not found');

  const style = match[1];
  assert.ok(!/\d(vw|vh)/.test(style), `uses viewport units: ${style}`);
  assert.match(style, /width:\s*100%/, 'width should fill its column');
  assert.match(style, /max-width:/, 'needs a max-width cap');
  assert.match(style, /aspect-ratio:\s*1\s*\/\s*1/, 'must stay square');
});
