/**
 * Data-contract test: origins must live inline in the kanji bundle, not in a
 * separate kanji-origins.json file.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), 'utf8');

test('kanji bundle carries inline origin data', () => {
  const data = JSON.parse(read('data/kanji.min.json'));
  const withOrigin = data.filter(k => k.origin_type);
  const withComponents = data.filter(k => k.origin_components && k.origin_components.length);

  assert.equal(withOrigin.length, 67, 'expected 67 kanji with origins');
  assert.equal(withComponents.length, 6, 'expected 6 kanji with structured components');

  const ri = data.find(k => k.kanji === '日');
  assert.equal(ri.origin_type, '象形文字');
  assert.ok(ri.origin_description.length > 0);

  const ji = data.find(k => k.kanji === '字');
  assert.ok(ji.origin_components.some(c => c.part === '子'));
});

test('legacy kanji-origins.json file is gone', () => {
  assert.equal(existsSync(fileURLToPath(new URL('data/kanji-origins.json', root))), false);
});
