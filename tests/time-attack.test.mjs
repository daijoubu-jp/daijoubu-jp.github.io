/**
 * Tests for the Kanji Time Attack pure core.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BANDS,
  filterPool,
  pickDistractors,
  makeQuestions,
  scoreResult,
} from '../assets/js/games/time-attack-core.js';

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const POOL = [
  { kanji: '一', jlpt: 5, grade: 1, kanken: '10', meanings_th: ['หนึ่ง'] },
  { kanji: '日', jlpt: 5, grade: 1, kanken: '10', meanings_th: ['วัน', 'พระอาทิตย์'] },
  { kanji: '山', jlpt: 5, grade: 3, kanken: '8', meanings_th: ['ภูเขา'] },
  { kanji: '愛', jlpt: 3, grade: 8, kanken: '2', meanings_th: ['ความรัก', 'รัก'] },
  { kanji: '硫', jlpt: 2, grade: 8, kanken: '4', meanings_th: ['กำมะถัน'] },
  { kanji: '刹', jlpt: null, grade: null, kanken: 'jun1', meanings_th: ['วัด', 'ฉับพลัน'] },
];

test('BANDS exposes 5 JLPT and 4 school/Kanken bands', () => {
  assert.equal(BANDS.length, 9);
  assert.ok(BANDS.some(b => b.id === 'n5'));
  assert.ok(BANDS.some(b => b.id === 'univ'));
});

test('filterPool selects by JLPT band', () => {
  const pool = filterPool(POOL, 'n5');
  assert.deepEqual(pool.map(k => k.kanji), ['一', '日', '山']);
});

test('filterPool selects by Kanken-derived stage', () => {
  assert.deepEqual(filterPool(POOL, 'mid').map(k => k.kanji), ['硫']);
  assert.deepEqual(filterPool(POOL, 'univ').map(k => k.kanji), ['刹']);
  assert.deepEqual(filterPool(POOL, 'elementary').map(k => k.kanji), ['一', '日', '山']);
});

test('pickDistractors returns distinct meanings and never the answer', () => {
  const distractors = pickDistractors(POOL, 'หนึ่ง', 3, seededRng(1));
  assert.equal(distractors.length, 3);
  assert.equal(new Set(distractors).size, 3);
  assert.ok(!distractors.includes('หนึ่ง'));
});

test('pickDistractors degrades gracefully on a small pool', () => {
  const small = [POOL[0], POOL[1]];
  const distractors = pickDistractors(small, 'หนึ่ง', 3, seededRng(2));
  assert.equal(distractors.length, 1);
  assert.deepEqual(distractors, ['วัน']);
});

test('makeQuestions yields 4 unique options including the correct one', () => {
  const questions = makeQuestions(POOL, 3, seededRng(3));
  assert.equal(questions.length, 3);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.correct));
  }
});

test('makeQuestions never repeats a kanji in one round', () => {
  const questions = makeQuestions(POOL, 6, seededRng(4));
  const kanji = questions.map(q => q.kanji);
  assert.equal(new Set(kanji).size, kanji.length);
});

test('makeQuestions clamps to the pool size', () => {
  const questions = makeQuestions(POOL, 99, seededRng(5));
  assert.equal(questions.length, POOL.length);
});

test('scoreResult tracks a new best', () => {
  assert.deepEqual(scoreResult(7, 5), { best: 7, isNewBest: true });
  assert.deepEqual(scoreResult(3, 5), { best: 5, isNewBest: false });
});
