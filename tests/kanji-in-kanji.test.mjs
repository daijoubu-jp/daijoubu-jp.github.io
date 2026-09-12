/**
 * Tests for the Kanji in Kanji pure core.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  pickDecoys,
  buildPuzzle,
  makePuzzles,
  isComplete,
} from '../assets/js/games/kanji-in-kanji-core.js';

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ENTRIES = {
  明: ['日', '月'],
  語: ['言', '口', '五', '一'],
  森: ['木', '林'],
};

const POOL = ['木', '口', '日', '月', '言', '五', '一', '林', '氵', '心', '大'];

test('pickDecoys returns distinct components not in the answer', () => {
  const decoys = pickDecoys(POOL, ['日', '月'], 3, seededRng(1));
  assert.equal(decoys.length, 3);
  assert.equal(new Set(decoys).size, 3);
  assert.ok(decoys.every(d => !['日', '月'].includes(d)));
});

test('buildPuzzle yields unique tiles covering the real components', () => {
  const puzzle = buildPuzzle('明', ENTRIES['明'], POOL, 3, seededRng(2));
  assert.equal(puzzle.kanji, '明');
  assert.equal(puzzle.tiles.length, 5);
  assert.equal(new Set(puzzle.tiles).size, 5);
  for (const comp of ENTRIES['明']) assert.ok(puzzle.tiles.includes(comp));
});

test('buildPuzzle degrades when the pool is small', () => {
  const puzzle = buildPuzzle('語', ENTRIES['語'], ['言', '口', '五', '一', '心'], 3, seededRng(3));
  assert.deepEqual(puzzle.tiles.length, 5);
  assert.ok(puzzle.tiles.includes('心'));
});

test('makePuzzles never repeats a target', () => {
  const puzzles = makePuzzles(['明', '語', '森'], ENTRIES, POOL, 2, 3, seededRng(4));
  assert.equal(puzzles.length, 2);
  assert.equal(new Set(puzzles.map(p => p.kanji)).size, 2);
});

test('isComplete only when every real component is selected', () => {
  assert.equal(isComplete(['日', '月'], ENTRIES['明']), true);
  assert.equal(isComplete(['日'], ENTRIES['明']), false);
  assert.equal(isComplete([], ENTRIES['明']), false);
});
