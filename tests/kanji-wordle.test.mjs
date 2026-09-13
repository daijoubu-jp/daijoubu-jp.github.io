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
  ALL_JOYO_BAND,
  cellToEmoji,
  guessToEmojiRow,
  generateEmojiGrid,
  formatWordleShare,
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

test('there are seven columns including the guessed kanji', () => {
  assert.deepEqual(COLUMNS.map(c => c.id), ['kanji', 'strokes', 'radical', 'kanken', 'jlpt', 'stage', 'joyo']);
});

test('guessed kanji column displays character and matches target', () => {
  const match = feedback(TARGET, TARGET).find(c => c.id === 'kanji');
  assert.equal(match.state, 'correct');
  assert.equal(match.display, '明');

  const wrong = feedback(FIXTURE[1], TARGET).find(c => c.id === 'kanji');
  assert.equal(wrong.state, 'wrong');
  assert.equal(wrong.display, '暗');
});

test('an exact match is all correct', () => {
  const cells = feedback(TARGET, TARGET);
  assert.ok(cells.every(c => c.state === 'correct'));
});

test('stroke differences point to the target', () => {
  const strokes = feedback(FIXTURE[1], TARGET).find(c => c.id === 'strokes');
  assert.equal(strokes.id, 'strokes');
  assert.equal(strokes.state, 'lower'); // target has fewer strokes
  assert.equal(strokes.display, 13);
  const strokes2 = feedback(FIXTURE[2], TARGET).find(c => c.id === 'strokes');
  assert.equal(strokes2.state, 'higher'); // target has more
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

test('ALL_JOYO_BAND matches joyo characters only', () => {
  assert.equal(ALL_JOYO_BAND.id, 'all-joyo');
  assert.equal(ALL_JOYO_BAND.label, 'รวมคันจิโจโยทั้งหมด');
  assert.equal(ALL_JOYO_BAND.match({ joyo: true }), true);
  assert.equal(ALL_JOYO_BAND.match({ joyo: false }), false);
  assert.equal(ALL_JOYO_BAND.match({ joyo: null }), false);
});

test('cellToEmoji maps feedback states to emojis', () => {
  assert.equal(cellToEmoji('correct'), '🟩');
  assert.equal(cellToEmoji('higher'), '🟨');
  assert.equal(cellToEmoji('lower'), '🟨');
  assert.equal(cellToEmoji('wrong'), '⬜');
  assert.equal(cellToEmoji('unknown'), '⬜');
});

test('guessToEmojiRow converts 7 columns of feedback into a 7-emoji string', () => {
  const rowTarget = guessToEmojiRow(TARGET, TARGET);
  assert.equal(rowTarget, '🟩🟩🟩🟩🟩🟩🟩');

  // FIXTURE[1] against TARGET:
  // kanji: 暗 vs 明 -> wrong (⬜)
  // strokes: 13 vs 8 -> lower (🟨)
  // radical: 72 vs 72 -> correct (🟩)
  // kanken: 8 (rank 3) vs 9 (rank 2) -> lower (🟨)
  // jlpt: 3 vs 4 -> higher (🟨)
  // stage: null vs 2 -> wrong (⬜)
  // joyo: true vs true -> correct (🟩)
  const rowFixture = guessToEmojiRow(FIXTURE[1], TARGET);
  assert.equal(rowFixture, '⬜🟨🟩🟨🟨⬜🟩');
});

test('generateEmojiGrid creates multi-line emoji grid', () => {
  const grid = generateEmojiGrid([FIXTURE[1], TARGET], TARGET);
  const lines = grid.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], '⬜🟨🟩🟨🟨⬜🟩');
  assert.equal(lines[1], '🟩🟩🟩🟩🟩🟩🟩');
});

test('formatWordleShare builds correct daily winning share message', () => {
  const text = formatWordleShare({
    date: '2026-09-13',
    won: true,
    guesses: [FIXTURE[1], TARGET],
    target: TARGET,
    streak: 5,
    maxGuesses: 6,
    mode: 'daily',
    url: 'https://daijoubu-jp.github.io/games/kanji-wordle.html',
  });

  assert.ok(text.includes('คันจิเวิร์ดเดิล (漢字・WORDLE) 2026-09-13'));
  assert.ok(text.includes('2/6 · สตรีค 5 วัน'));
  assert.ok(text.includes('⬜🟨🟩🟨🟨⬜🟩\n🟩🟩🟩🟩🟩🟩🟩'));
  assert.ok(text.endsWith('https://daijoubu-jp.github.io/games/kanji-wordle.html'));
});

test('formatWordleShare builds correct daily lost share message', () => {
  const text = formatWordleShare({
    date: '2026-09-13',
    won: false,
    guesses: [FIXTURE[1], FIXTURE[2], FIXTURE[3]],
    target: TARGET,
    streak: 0,
    maxGuesses: 6,
    mode: 'daily',
  });

  assert.ok(text.includes('คันจิเวิร์ดเดิล (漢字・WORDLE) 2026-09-13'));
  assert.ok(text.includes('X/6 · สตรีค 0 วัน'));
  assert.ok(text.includes('https://daijoubu-jp.github.io/games/kanji-wordle.html'));
});

test('formatWordleShare handles practice mode and empty guesses gracefully', () => {
  const practiceWin = formatWordleShare({
    won: true,
    guesses: [TARGET],
    target: TARGET,
    mode: 'practice',
  });
  assert.ok(practiceWin.includes('คันจิเวิร์ดเดิล (漢字・WORDLE) ฝึกฝน'));
  assert.ok(practiceWin.includes('ชนะใน 1 ครั้ง'));

  const emptyShare = formatWordleShare();
  assert.ok(emptyShare.includes('คันจิเวิร์ดเดิล (漢字・WORDLE)'));
  assert.ok(emptyShare.includes('X/6'));

  // When returning to daily after reload where guesses are empty, guessCount fallback prevents 0/6
  const reloadShare = formatWordleShare({
    date: '2026-09-13',
    won: true,
    guesses: [],
    guessCount: 4,
    target: TARGET,
    streak: 3,
    maxGuesses: 6,
    mode: 'daily',
  });
  assert.ok(reloadShare.includes('4/6 · สตรีค 3 วัน'));
  assert.ok(!reloadShare.includes('0/6'));

  const practiceGiveUp = formatWordleShare({
    won: false,
    guesses: [],
    target: TARGET,
    mode: 'practice',
  });
  assert.ok(practiceGiveUp.includes('หมดโอกาส'));
});