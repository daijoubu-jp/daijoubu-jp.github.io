/**
 * tests/prefectures.test.mjs
 * Data-contract tests for the 47 Japan prefectures compiled from content/prefectures/*.md.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { prefectures } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/prefectures.json', import.meta.url)), 'utf8')
);

test('prefectures.json has exactly 47 entries in official JIS order', () => {
  assert.equal(prefectures.length, 47);
  prefectures.forEach((p, i) => assert.equal(p.code, String(i + 1).padStart(2, '0')));
});

test('every prefecture has complete required fields', () => {
  for (const p of prefectures) {
    for (const f of ['slug','name_ja','name_hira','name_romaji','name_th','region',
                     'capital','capital_reading','etymology','flower','tree','bird']) {
      assert.ok(p[f] && String(p[f]).length > 0, `${p.code} missing ${f}`);
    }
    assert.ok(Number.isFinite(p.population) && p.population > 0, `${p.code} bad population`);
    assert.ok(Number.isFinite(p.area_km2) && p.area_km2 > 0, `${p.code} bad area_km2`);
    assert.match(p.population_year, /^\d{4}$/, `${p.code} bad population_year`);
    assert.ok(Array.isArray(p.places) && p.places.length >= 3, `${p.code} needs >=3 places`);
    assert.ok(Array.isArray(p.products) && p.products.length >= 3, `${p.code} needs >=3 products`);
  }
});

test('places and products have name and nullable thai gloss', () => {
  for (const p of prefectures) {
    for (const list of [p.places, p.products]) {
      for (const item of list) {
        assert.ok(item.name && item.name.length > 0, `${p.code}: entry missing name`);
        assert.equal('th' in item, true, `${p.code}: ${item.name} missing th key`);
      }
    }
  }
});

test('slugs are unique and lowercase-ascii', () => {
  const slugs = prefectures.map(p => p.slug);
  assert.equal(new Set(slugs).size, 47);
  slugs.forEach(s => assert.match(s, /^[a-z]+$/));
});

test('content markdown count matches 47', () => {
  const dir = fileURLToPath(new URL('../content/prefectures', import.meta.url));
  assert.equal(readdirSync(dir).filter(f => f.endsWith('.md')).length, 47);
});
