/**
 * Data-contract test for the Kanji in Kanji decompositions (KRADFILE-u).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const data = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/kanji-components.min.json', import.meta.url)), 'utf8')
);
const { entries, pool } = data;

test('component data has a healthy coverage', () => {
  assert.ok(Object.keys(entries).length >= 5600, 'expected >= 5600 decompositions');
  assert.ok(pool.length >= 200, 'expected >= 200 distinct components');
});

test('every entry has 2+ single-character components and never itself', () => {
  for (const [kanji, components] of Object.entries(entries)) {
    assert.ok(components.length >= 2, `${kanji}: expected 2+ components`);
    assert.equal(new Set(components).size, components.length, `${kanji}: duplicate components`);
    for (const comp of components) {
      assert.notEqual(comp, kanji, `${kanji}: component equals target`);
      assert.equal(Array.from(comp).length, 1, `${kanji}: component is not a single character`);
    }
  }
});

test('the decoy pool contains every used component', () => {
  const poolSet = new Set(pool);
  for (const components of Object.values(entries)) {
    for (const comp of components) {
      assert.ok(poolSet.has(comp), `pool missing ${comp}`);
    }
  }
});

test('known decompositions are correct', () => {
  assert.ok(entries['語'].includes('言'));
  assert.ok(entries['語'].includes('口'));
  assert.ok(entries['明'].includes('日'));
  assert.ok(entries['明'].includes('月'));
});
