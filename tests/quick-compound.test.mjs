/**
 * Tests for the Quick Compound pure core.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  pickValidIndices,
  pickDecoyIndices,
  buildRound,
  makeRounds,
  isRoundComplete,
} from '../assets/js/games/quick-compound-core.js';

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DATA = {
  words: [
    ['日本', 'にほん', 'Japan'],
    ['一人', 'ひとり', 'one person'],
    ['山道', 'やまみち', 'mountain road'],
    ['花見', 'はなみ', 'flower viewing'],
    ['木曜日', 'もくようび', 'Thursday'],
  ],
  byKanji: { 日: [0, 4], 人: [1], 山: [2], 花: [3], 木: [4] },
};

test('pickValidIndices returns compounds containing the target kanji', () => {
  const indices = pickValidIndices(DATA, '日', 5, seededRng(1));
  assert.equal(indices.length, 2);
  assert.ok(indices.every(i => DATA.words[i][0].includes('日')));
});

test('pickDecoyIndices returns compounds without the target kanji', () => {
  const indices = pickDecoyIndices(DATA, '人', 3, seededRng(2));
  assert.equal(indices.length, 3);
  assert.equal(new Set(indices).size, 3);
  assert.ok(indices.every(i => !DATA.words[i][0].includes('人')));
});

test('buildRound mixes unique valid and decoy tiles', () => {
  const round = buildRound('日', DATA, 2, 2, seededRng(3));
  assert.equal(round.kanji, '日');
  assert.equal(round.valid.length, 2);
  assert.equal(round.tiles.length, 4);
  assert.equal(new Set(round.tiles).size, 4);
  for (const index of round.valid) assert.ok(round.tiles.includes(index));
});

test('buildRound clamps valid tiles to what the kanji has', () => {
  const round = buildRound('人', DATA, 4, 1, seededRng(4));
  assert.equal(round.valid.length, 1);
  assert.equal(round.tiles.length, 2);
});

test('makeRounds skips targets without compounds and never repeats', () => {
  const rounds = makeRounds(['日', '人', '山', '海'], DATA, 5, 1, 2, seededRng(5));
  assert.deepEqual(rounds.map(r => r.kanji).sort(), ['人', '山', '日']);
  assert.equal(new Set(rounds.map(r => r.kanji)).size, rounds.length);
});

test('isRoundComplete only when every valid compound is selected', () => {
  assert.equal(isRoundComplete([0, 4], [0, 4]), true);
  assert.equal(isRoundComplete([0], [0, 4]), false);
  assert.equal(isRoundComplete([], [0]), false);
});
