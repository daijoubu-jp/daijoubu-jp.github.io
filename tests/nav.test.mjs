/**
 * Guards the navigation: dropdown parents are keyboard-accessible toggle
 * buttons (not anchors duplicating the first submenu item).
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

test('every page has 3 dropdown toggle buttons and no duplicate parent anchors', () => {
  const files = htmlFiles(root);
  assert.ok(files.length >= 16, `expected 16+ pages, found ${files.length}`);

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = file.slice(root.length);

    assert.equal(
      (html.match(/nav-link nav-dropdown-toggle/g) || []).length,
      3,
      `${rel}: expected 3 dropdown toggle buttons`
    );
    assert.equal(
      (html.match(/class="nav-link" data-nav="(dictionary|knowledge|tools)"/g) || []).length,
      0,
      `${rel}: duplicate parent anchors still present`
    );
    assert.match(html, /data-nav="dictionary" aria-expanded="false" aria-haspopup="true"/,
      `${rel}: dictionary toggle missing aria-expanded`);
  }
});

test('mobile nav handler wires the toggle buttons', () => {
  const main = readFileSync(join(root, 'assets/js/main.js'), 'utf8');
  assert.match(main, /querySelectorAll\('a, button\.nav-dropdown-toggle'\)/);
});
