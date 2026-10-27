/**
 * Guards the knowledge dropdown navigation: every page that ships the
 * knowledge menu must present the same nine items in the same order.
 *
 * Navigation markup is duplicated in every page (there is no partials
 * mechanism and no build step), so this is the only thing standing between
 * the site and a silently orphaned knowledge page.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'studio') return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(full) : (entry.name.endsWith('.html') ? [full] : []);
  });
}

const CANONICAL = [
  'knowledge/index.html',
  'knowledge/jp-eras.html',
  'knowledge/chinese-zodiacs.html',
  'knowledge/jp-prefectures.html',
  'knowledge/history.html',
  'knowledge/handwriting.html',
  'knowledge/kanken.html',
  'knowledge/radicals.html',
  'knowledge/jukugo.html',
];

test('knowledge dropdown navigation matches the canonical list on every page', () => {
  const files = htmlFiles(root);
  let checkedPages = 0;

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (!html.includes('data-nav="knowledge"')) continue;

    const match = html.match(/<button[^>]*data-nav="knowledge"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
    assert.ok(match, `${relative(root, file)}: knowledge dropdown markup not found`);

    const items = [...match[1].matchAll(/href=["']([^"']+)["']/g)].map((m) =>
      relative(root, resolve(dirname(file), m[1].split('#')[0].split('?')[0]))
    );

    assert.deepEqual(
      items,
      CANONICAL,
      `${relative(root, file)}: knowledge dropdown must match the canonical nine-item list, in order`
    );
    checkedPages += 1;
  }

  assert.ok(checkedPages >= 24, `expected at least 24 pages with a knowledge dropdown, checked ${checkedPages}`);
});
