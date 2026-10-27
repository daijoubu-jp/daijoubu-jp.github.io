/**
 * Structural accessibility invariants across every page:
 *   1. exactly one <h1> (screen-reader and search-engine document root)
 *   2. no heading-level skips (h2 -> h4 breaks screen-reader navigation)
 *   3. every form control exposes an accessible name
 *
 * browse/index.html and browse/kanji.html shipped with zero <h1>, three
 * knowledge pages skipped h2 -> h4, and seven controls had no name at all.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = ['.git', 'node_modules', 'studio', 'data', 'scratch', 'ref-screenshots'];

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP_DIRS.includes(entry.name)) return [];
    const full = join(dir, entry.name);
    return entry.isDirectory()
      ? htmlFiles(full)
      : (entry.name.endsWith('.html') ? [full] : []);
  });
}

const pages = htmlFiles(root);
const read = (file) => ({ rel: file.slice(root.length).replace(/^\/+/, ''), html: readFileSync(file, 'utf8') });

test('every page has exactly one <h1>', () => {
  assert.ok(pages.length >= 24, `expected 24+ pages, found ${pages.length}`);

  const offenders = [];
  for (const file of pages) {
    const { rel, html } = read(file);
    const count = (html.match(/<h1\b/gi) || []).length;
    if (count !== 1) offenders.push(`${rel}: ${count} <h1> element(s)`);
  }
  assert.deepEqual(offenders, [], `one <h1> per page:\n${offenders.join('\n')}`);
});

test('heading levels never skip a rank', () => {
  const offenders = [];
  for (const file of pages) {
    const { rel, html } = read(file);
    let last = 0;
    for (const match of html.matchAll(/<h([1-6])\b/gi)) {
      const level = Number(match[1]);
      if (last && level > last + 1) {
        offenders.push(`${rel}: h${last} -> h${level}`);
      }
      last = level;
    }
  }
  assert.deepEqual(offenders, [], `heading ranks must not skip:\n${offenders.join('\n')}`);
});

test('every form control has an accessible name', () => {
  const offenders = [];
  for (const file of pages) {
    const { rel, html } = read(file);
    // Controls wrapped by a <label> inherit that label's text; only unwrapped
    // ones need aria-label / aria-labelledby / an explicit <label for>.
    const unwrapped = html.replace(/<label\b[^>]*>[\s\S]*?<\/label>/gi, '');

    for (const match of unwrapped.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const tag = match[1].toLowerCase();
      const attrs = match[2];
      const attr = (name) => {
        const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
        return m ? m[1] : null;
      };

      const type = (attr('type') || '').toLowerCase();
      if (tag === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;

      if (attr('aria-label') || attr('aria-labelledby')) continue;

      const id = attr('id');
      if (id && new RegExp(`<label[^>]*\\bfor="${id}"`, 'i').test(html)) continue;

      offenders.push(`${rel}: <${tag}${id ? ` #${id}` : ''}> has no accessible name`);
    }
  }
  assert.deepEqual(offenders, [], `form controls need a name:\n${offenders.join('\n')}`);
});
