/**
 * Guards theming wiring: every HTML page must load base.css, components.css
 * and all six seasonal theme stylesheets, so the theme and light/dark mode
 * switchers work everywhere (regression guard for the knowledge pages that
 * shipped without the theme links).
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

const REQUIRED_STYLESHEETS = [
  'assets/css/base.css',
  'assets/css/components.css',
  'assets/css/themes/spring.css',
  'assets/css/themes/summer.css',
  'assets/css/themes/autumn.css',
  'assets/css/themes/winter.css',
  'assets/css/themes/anime.css',
  'assets/css/themes/ukiyoe.css',
];

test('every HTML page loads base, components and all six theme stylesheets', () => {
  const files = htmlFiles(root);
  assert.ok(files.length >= 20, `expected 20+ HTML pages, found ${files.length}`);

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = file.slice(root.length);

    for (const sheet of REQUIRED_STYLESHEETS) {
      const pattern = new RegExp(`href="[^"]*${sheet.replace('.', '\\.')}`);
      assert.match(
        html,
        pattern,
        `${rel}: missing stylesheet link for ${sheet}`
      );
    }
  }
});
