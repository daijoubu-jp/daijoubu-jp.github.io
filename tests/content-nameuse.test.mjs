/**
 * Data-contract test: name_use (人名用漢字 legality) is derived from KANJIDIC2
 * and must be true for every Joyo kanji plus the Jinmeiyou present in our data.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const data = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/kanji.min.json', import.meta.url)), 'utf8')
);

test('nameUse marks exactly the 2780 name-legal dataset kanji', () => {
  const legal = data.filter(k => k.nameUse);
  assert.equal(legal.length, 2780);
});

test('every Joyo kanji is name-legal', () => {
  const joyo = data.filter(k => k.joyo);
  assert.ok(joyo.length > 0);
  assert.ok(joyo.every(k => k.nameUse === true));
});

test('nameUse is only ever true (absent means not name-legal)', () => {
  assert.ok(data.every(k => k.nameUse === undefined || k.nameUse === true));
  const sample = data.find(k => k.kanji === '丞');
  assert.equal(sample.nameUse, true);
});
