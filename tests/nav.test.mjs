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
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'studio') return [];
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

// The header is duplicated on every page and only exists as markup, so a page
// can silently ship a stale copy: the pre-refactor brand classes (.brand-logo,
// .brand-title, .header-inner, ...) have zero CSS rules and the plain
// .nav-menu-toggle class has none either, which collapsed the hamburger to an
// 18x6 px sliver on the one page that used it. Layout is not asserted here --
// only that every page asks for the classes the stylesheet actually defines and
// that the toggle is the container's first child, so flex ordering matches.
const LEGACY_HEADER_CLASSES = [
  'header-inner',
  'brand-logo',
  'brand-seal',
  'brand-title',
  'brand-text',
  'brand-subtitle',
];

test('every page uses the current header classes, not the pre-refactor ones', () => {
  const files = htmlFiles(root);
  assert.ok(files.length >= 24, `expected 24+ pages, found ${files.length}`);

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = file.slice(root.length);

    // Compare whole class tokens: a substring test would flag nav-brand-logo
    // as an offender for brand-logo.
    const classTokens = new Set(
      [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean)
    );

    for (const legacy of LEGACY_HEADER_CLASSES) {
      assert.ok(
        !classTokens.has(legacy),
        `${rel}: uses the pre-refactor class "${legacy}" which has no CSS rules`
      );
    }

    assert.equal(
      (html.match(/class="nav-menu-toggle"/g) || []).length,
      0,
      `${rel}: uses "nav-menu-toggle" instead of the styled "nav-menu-toggle-btn"`
    );

    // Structure check: inside the header, with comments stripped (pages differ in
    // whether they annotate the toggle), the hamburger must be the container's
    // first element child so mobile flex ordering keeps it at the left edge.
    const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/);
    assert.ok(header, `${rel}: no <header class="site-header"> block found`);
    const headerMarkup = header[0].replace(/<!--[\s\S]*?-->/g, '');

    assert.match(
      headerMarkup,
      /<div class="container">\s*<button[^>]*class="nav-menu-toggle-btn"[^>]*id="nav-menu-toggle-btn"/,
      `${rel}: the hamburger must be the first child of .container so it keeps 44x44 at the left edge on mobile`
    );

    assert.match(html, /class="nav-brand"/, `${rel}: brand block must use .nav-brand`);
    assert.match(html, /class="nav-brand-title"/, `${rel}: brand title must use .nav-brand-title`);
  }
});

// Desktop dropdowns are hover-only in CSS, and main.js gates its click/Enter
// toggle behind `innerWidth <= 768`. Without :focus-within the menus are
// unreachable by keyboard on desktop, so the hover rule must always be paired.
test('desktop dropdown rules expose a keyboard path (:focus-within)', () => {
  const css = readFileSync(join(root, 'assets/css/components.css'), 'utf8');

  const pairs = [
    ['.nav-dropdown:hover .dropdown-menu', '.nav-dropdown:focus-within .dropdown-menu'],
    ['.nav-dropdown-submenu:hover > .dropdown-sub-menu',
     '.nav-dropdown-submenu:focus-within > .dropdown-sub-menu'],
  ];

  for (const [hover, focus] of pairs) {
    assert.ok(css.includes(hover), `components.css: lost the hover rule "${hover}"`);
    assert.ok(
      css.includes(focus),
      `components.css: "${focus}" is missing, so keyboard users cannot open desktop dropdowns`
    );
  }
});
