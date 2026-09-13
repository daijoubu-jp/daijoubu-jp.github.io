/**
 * Tests for the Kanji Wordle stats helpers in storage.js.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { getWordleStats, saveWordleResult, isConsecutiveDay } = await import('../assets/js/storage.js');

test('wordle stats start empty', () => {
  assert.deepEqual(getWordleStats(), {
    currentStreak: 0, maxStreak: 0, played: 0, won: 0,
    distribution: [0, 0, 0, 0, 0, 0], lastDate: null, lastResult: null,
  });
});

test('isConsecutiveDay accurately detects consecutive calendar days', () => {
  assert.equal(isConsecutiveDay('2026-09-12', '2026-09-13'), true);
  assert.equal(isConsecutiveDay('2026-09-13', '2026-09-15'), false); // skipped 14th
  assert.equal(isConsecutiveDay('2026-09-30', '2026-10-01'), true); // month boundary
  assert.equal(isConsecutiveDay(null, '2026-09-13'), false);
  assert.equal(isConsecutiveDay('invalid', '2026-09-13'), false);
});

test('a win updates streak, wins and the guess distribution', () => {
  const stats = saveWordleResult({ date: '2026-09-12', won: true, guesses: 3 });
  assert.equal(stats.played, 1);
  assert.equal(stats.won, 1);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.maxStreak, 1);
  assert.deepEqual(stats.distribution, [0, 0, 1, 0, 0, 0]);
  assert.deepEqual(stats.lastResult, { won: true, guesses: 3 });
});

test('a loss resets the streak but keeps the max', () => {
  const stats = saveWordleResult({ date: '2026-09-13', won: false, guesses: 6 });
  assert.equal(stats.played, 2);
  assert.equal(stats.won, 1);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.maxStreak, 1);
});

test('saving twice for the same date is a no-op', () => {
  const before = getWordleStats();
  const after = saveWordleResult({ date: '2026-09-13', won: true, guesses: 1 });
  assert.deepEqual(after, before);
});

test('a win after a loss restarts the streak', () => {
  const stats = saveWordleResult({ date: '2026-09-14', won: true, guesses: 1 });
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.maxStreak, 1);
  assert.deepEqual(stats.distribution, [1, 0, 1, 0, 0, 0]);
});

test('consecutive day win increases streak to 2', () => {
  const stats = saveWordleResult({ date: '2026-09-15', won: true, guesses: 2 });
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.maxStreak, 2);
});

test('skipping a day resets the current streak on next win while keeping max', () => {
  // Played on 2026-09-15, skipped 2026-09-16, now wins on 2026-09-17
  const stats = saveWordleResult({ date: '2026-09-17', won: true, guesses: 4 });
  assert.equal(stats.currentStreak, 1); // reset from 2 to 1
  assert.equal(stats.maxStreak, 2); // max remains 2
});