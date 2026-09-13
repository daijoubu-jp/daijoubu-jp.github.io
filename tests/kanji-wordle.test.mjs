/**
 * Tests for the Kanji Wordle pure core.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COLUMNS,
  feedback,
  isWin,
  kankenRank,
  stageRank,
  dailyTarget,
} from '../assets/js/games/kanji-wordle-core.js';

const TARGET = {
  kanji: '明', strokes: 8, radical: 72, radicalChar: '日',
  kanken: '9', jlpt: 4, grade: 2, joyo: true,
};

const FIXTURE = [
  TARGET,
  { kanji: '暗', strokes: 13, radical: 72, radicalChar: '日', kanken: '8', jlpt: 3, grade: null, joyo: true },
  { kanji: '日', strokes: 4, radical: 72, radicalChar: '日', kanken: '10', jlpt: 5, grade: 1, joyo: true },
  { kanji: '刹', strokes: 7, radical: 18, radicalChar: '刀', kanken: 'jun1', jlpt: null, grade: null, joyo: false },
];

test('there are six hint columns', () => {
  assert.deepEqual(COLUMNS.map(c => c.id), ['strokes', 'radical', 'kanken', 'jlpt', 'stage', 'joyo']);
});

test('an exact match is all correct', () => {
  const cells = feedback(TARGET, TARGET);
  assert.ok(cells.every(c => c.state === 'correct'));
});

test('stroke differences point to the target', () => {
  const [strokes] = feedback(FIXTURE[1], TARGET);
  assert.equal(strokes.id, 'strokes');
  assert.equal(strokes.state, 'lower'); // target has fewer strokes
  assert.equal(strokes.display, 13);
  assert.equal(feedback(FIXTURE[2], TARGET)[0].state, 'higher'); // target has more
});

test('kanken and stage use explicit rank order', () => {
  assert.equal(kankenRank({ kanken: '10' }), 1);
  assert.equal(kankenRank({ kanken: '1' }), 12);
  assert.equal(stageRank({ grade: 1 }), 1);
  assert.equal(stageRank({ grade: 8 }), 7);
  assert.equal(stageRank({ grade: null }), null);
});

test('jlpt differences point to the target and missing jlpt is gray', () => {
  const jlpt = (g, t) => feedback(g, t).find(c => c.id === 'jlpt');
  assert.equal(jlpt(FIXTURE[0], FIXTURE[1]).state, 'higher'); // N4 -> N3
  assert.equal(jlpt(FIXTURE[1], FIXTURE[0]).state, 'lower');
  assert.equal(jlpt(FIXTURE[3], TARGET).state, 'wrong'); // no JLPT
});

test('radical and joyo are exact-only', () => {
  const radical = (g, t) => feedback(g, t).find(c => c.id === 'radical');
  const joyo = (g, t) => feedback(g, t).find(c => c.id === 'joyo');
  assert.equal(radical(FIXTURE[1], TARGET).state, 'correct');
  assert.equal(radical(FIXTURE[3], TARGET).state, 'wrong');
  assert.equal(joyo(FIXTURE[2], TARGET).state, 'correct');
  assert.equal(joyo(FIXTURE[3], TARGET).state, 'wrong');
});

test('isWin is an exact character match', () => {
  assert.equal(isWin(TARGET, TARGET), true);
  assert.equal(isWin(FIXTURE[1], TARGET), false);
});

test('dailyTarget is stable within a day and varies across days', () => {
  const day = new Date('2026-09-12T08:00:00');
  const same = new Date('2026-09-12T23:00:00');
  const a = dailyTarget(FIXTURE, day);
  const b = dailyTarget(FIXTURE, same);
  assert.equal(a.kanji, b.kanji);

  const picks = new Set();
  for (let d = 1; d <= 31; d += 1) {
    picks.add(dailyTarget(FIXTURE, new Date(2026, 8, d)).kanji);
  }
  assert.ok(picks.size > 1, 'daily target should vary across the month');
});