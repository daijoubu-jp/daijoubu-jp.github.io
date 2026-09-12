/**
 * Data-contract test for the Quick Compound word list (JMdict_e).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { words, byKanji } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/compounds.min.json', import.meta.url)), 'utf8')
);

const isKanji = (c) => (c >= '\u4e00' && c <= '\u9fff') || (c >= '\u3400' && c <= '\u4dbf');

test('compound data has a healthy size', () => {
  assert.ok(words.length >= 15000, `expected >= 15000 compounds, got ${words.length}`);
  assert.ok(Object.keys(byKanji).length >= 2000, 'expected >= 2000 covered kanji');
});

test('every compound is 2-4 all-kanji characters with a reading and gloss', () => {
  for (const [surface, reading, gloss] of words) {
    assert.ok(surface.length >= 2 && surface.length <= 4, `bad length: ${surface}`);
    assert.ok([...surface].every(isKanji), `non-kanji surface: ${surface}`);
    assert.ok(reading && reading.length > 0, `missing reading: ${surface}`);
    assert.ok(gloss && gloss.length > 0, `missing gloss: ${surface}`);
  }
});

test('words are unique by surface + reading', () => {
  const keys = words.map(([surface, reading]) => `${surface}|${reading}`);
  assert.equal(new Set(keys).size, keys.length);
});

test('byKanji indexes real compounds that contain the kanji', () => {
  for (const [kanji, indices] of Object.entries(byKanji)) {
    assert.ok(indices.length > 0, `${kanji}: empty index`);
    assert.equal(new Set(indices).size, indices.length, `${kanji}: duplicate indices`);
    for (const index of indices) {
      assert.ok(index >= 0 && index < words.length, `${kanji}: index out of range`);
      assert.ok(words[index][0].includes(kanji), `${kanji}: ${words[index][0]} lacks it`);
    }
  }
});