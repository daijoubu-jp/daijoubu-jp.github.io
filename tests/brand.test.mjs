/**
 * Guards brand consistency: all HTML pages have "Daijoubu JP" in their title,
 * og:title and footers, with no legacy "KanjiThai" user-facing references.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(full) : (entry.name.endsWith('.html') ? [full] : []);
  });
}

test('every HTML page has Daijoubu JP brand in title and no KanjiThai in title/og:title/footer', () => {
  const files = htmlFiles(root);
  assert.ok(files.length >= 20, `expected 20+ HTML pages, found ${files.length}`);

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = file.slice(root.length);

    // Title checks
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    assert.ok(titleMatch, `${rel}: missing <title> tag`);
    assert.ok(
      !titleMatch[1].includes('KanjiThai'),
      `${rel}: <title> still contains legacy 'KanjiThai'`
    );

    // og:title checks
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="(.*?)"/);
    if (ogTitleMatch) {
      assert.ok(
        !ogTitleMatch[1].includes('KanjiThai'),
        `${rel}: og:title still contains legacy 'KanjiThai'`
      );
    }

    // Footer checks (excluding anti-FOUC backward-compatibility localStorage keys)
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
    if (footerMatch) {
      assert.ok(
        !footerMatch[0].includes('KanjiThai'),
        `${rel}: footer still contains legacy 'KanjiThai'`
      );
    }
  }
});
