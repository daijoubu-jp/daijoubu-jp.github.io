/**
 * Tests for the game-stat helpers in storage.js using an in-memory
 * localStorage mock.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { getGameResult, saveGameResult } = await import('../assets/js/storage.js');

test('game results default to zero', () => {
  assert.deepEqual(getGameResult('time-attack', 'n5'), { best: 0, last: 0 });
});

test('saveGameResult keeps the best and the latest score', () => {
  assert.deepEqual(saveGameResult('time-attack', 'n5', 3), { best: 3, last: 3 });
  assert.deepEqual(saveGameResult('time-attack', 'n5', 5), { best: 5, last: 5 });
  assert.deepEqual(saveGameResult('time-attack', 'n5', 2), { best: 5, last: 2 });
  assert.deepEqual(getGameResult('time-attack', 'n5'), { best: 5, last: 2 });
});

test('game results are isolated per band', () => {
  saveGameResult('time-attack', 'n4', 7);
  assert.deepEqual(getGameResult('time-attack', 'n4'), { best: 7, last: 7 });
  assert.deepEqual(getGameResult('time-attack', 'n5'), { best: 5, last: 2 });
});
