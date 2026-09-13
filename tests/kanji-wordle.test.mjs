/**
 * Tests for the Kanji Wordle pure core.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COLUMNS,
  feedback,
  isWin,
  matchOnyomi,
  matchKunyomi,
  matchOrigin,
  getGojuonRow,
  dailyTarget,
  ALL_JOYO_BAND,
  cellToEmoji,
  guessToEmojiRow,
  generateEmojiGrid,
  formatWordleShare,
} from '../assets/js/games/kanji-wordle-core.js';

const TARGET = {
  kanji: '明',
  strokes: 8,
  radical: 72,
  radicalChar: '日',
  onyomi: ['メイ', 'ミョウ'],
  kunyomi: ['あ.かり', 'あか.るい', 'あき.らか'],
  origin_type: '会意',
  jlpt: 4,
  joyo: true,
};

const FIXTURE = [
  TARGET,
  // 暗: strokes 13, radical 72, on: アン (A-row), kun: くら.い (K-row), origin: 形声
  {
    kanji: '暗',
    strokes: 13,
    radical: 72,
    radicalChar: '日',
    onyomi: ['アン'],
    kunyomi: ['くら.い'],
    origin_type: '形声',
    jlpt: 3,
    joyo: true,
  },
  // 日: strokes 4, radical 72, on: ニチ, ジツ (N-row), kun: ひ, か, origin: 象形
  {
    kanji: '日',
    strokes: 4,
    radical: 72,
    radicalChar: '日',
    onyomi: ['ニチ', 'ジツ'],
    kunyomi: ['ひ', 'か'],
    origin_type: '象形',
    jlpt: 5,
    joyo: true,
  },
  // 鳴: strokes 14, radical 196, on: メイ (M-row shared!), kun: な.く, origin: 会意 (shared!)
  {
    kanji: '鳴',
    strokes: 14,
    radical: 196,
    radicalChar: '鳥',
    onyomi: ['メイ'],
    kunyomi: ['な.く'],
    origin_type: '会意',
    jlpt: 2,
    joyo: true,
  },
];

test('there are six columns in the exact specified order', () => {
  assert.deepEqual(COLUMNS.map((c) => c.id), [
    'kanji',
    'strokes',
    'radical',
    'onyomi',
    'kunyomi',
    'origin',
  ]);
});

test('guessed kanji column displays character and matches target', () => {
  const match = feedback(TARGET, TARGET).find((c) => c.id === 'kanji');
  assert.equal(match.state, 'correct');
  assert.equal(match.display, '明');

  const wrong = feedback(FIXTURE[1], TARGET).find((c) => c.id === 'kanji');
  assert.equal(wrong.state, 'wrong');
  assert.equal(wrong.display, '暗');
});

test('an exact match is all correct', () => {
  const cells = feedback(TARGET, TARGET);
  assert.ok(cells.every((c) => c.state === 'correct'));
});

test('stroke differences point to the target', () => {
  const strokes = feedback(FIXTURE[1], TARGET).find((c) => c.id === 'strokes');
  assert.equal(strokes.state, 'lower'); // target has 8, guess has 13 -> lower
  assert.equal(strokes.display, 13);

  const strokes2 = feedback(FIXTURE[2], TARGET).find((c) => c.id === 'strokes');
  assert.equal(strokes2.state, 'higher'); // target has 8, guess has 4 -> higher
  assert.equal(strokes2.display, 4);
});

test('radical matching is exact-only', () => {
  const radicalSame = feedback(FIXTURE[1], TARGET).find((c) => c.id === 'radical');
  assert.equal(radicalSame.state, 'correct');
  assert.equal(radicalSame.display, '日');

  const radicalDiff = feedback(FIXTURE[3], TARGET).find((c) => c.id === 'radical');
  assert.equal(radicalDiff.state, 'wrong');
  assert.equal(radicalDiff.display, '鳥');
});

test('onyomi matching: exact shared reading, same Gojūon row, or wrong', () => {
  // 鳴 (メイ) vs 明 (メイ, ミョウ) -> exact match on メイ
  const exact = matchOnyomi(FIXTURE[3], TARGET);
  assert.equal(exact.state, 'correct');
  assert.equal(exact.display, 'メイ');

  // M-row candidate without exact match: 門 (モン - M-row) vs 明 (メイ, ミョウ - M-row) -> near
  const nearGuess = { onyomi: ['モン'] };
  const nearResult = matchOnyomi(nearGuess, TARGET);
  assert.equal(nearResult.state, 'near');
  assert.equal(nearResult.display, 'モン');

  // Different row: カ行 (コウ) vs M-row (メイ, ミョウ) -> wrong
  const diffGuess = { onyomi: ['コウ'] };
  const diffResult = matchOnyomi(diffGuess, TARGET);
  assert.equal(diffResult.state, 'wrong');
  assert.equal(diffResult.display, 'コウ');

  // Both have no onyomi -> correct
  assert.equal(matchOnyomi({ onyomi: [] }, { onyomi: [] }).state, 'correct');
  // One has no onyomi -> wrong
  assert.equal(matchOnyomi({ onyomi: [] }, TARGET).state, 'wrong');
});

test('kunyomi matching: stem match, initial mora match, or wrong', () => {
  // 赤 (あか, あか.い) vs 明 (あか.るい) -> shares stem 'あか'
  const stemGuess = { kunyomi: ['あか', 'あか.い'] };
  const stemResult = matchKunyomi(stemGuess, TARGET);
  assert.equal(stemResult.state, 'correct');

  // Initial mora match: 雨 (あめ) vs 明 (あか.るい) -> both start with 'あ'
  const moraGuess = { kunyomi: ['あめ'] };
  const moraResult = matchKunyomi(moraGuess, TARGET);
  assert.equal(moraResult.state, 'near');
  assert.equal(moraResult.display, 'あめ');

  // Different initial: 山 (やま) vs 明 (あか.るい) -> wrong
  const diffGuess = { kunyomi: ['やま'] };
  const diffResult = matchKunyomi(diffGuess, TARGET);
  assert.equal(diffResult.state, 'wrong');

  // Both have no kunyomi (on-only kanji) -> correct
  assert.equal(matchKunyomi({ kunyomi: [] }, { kunyomi: [] }).state, 'correct');
  assert.equal(matchKunyomi({ kunyomi: [] }, { kunyomi: [] }).display, '—');
});

test('origin matching: exact type match or wrong', () => {
  // 鳴 (会意) vs 明 (会意) -> correct
  const match = matchOrigin(FIXTURE[3], TARGET);
  assert.equal(match.state, 'correct');
  assert.equal(match.display, '会意');

  // 暗 (形声) vs 明 (会意) -> wrong
  const diff = matchOrigin(FIXTURE[1], TARGET);
  assert.equal(diff.state, 'wrong');
  assert.equal(diff.display, '形声');
});

test('getGojuonRow accurately classifies Hiragana and Katakana consonants', () => {
  assert.equal(getGojuonRow('サ'), 'S');
  assert.equal(getGojuonRow('し'), 'S');
  assert.equal(getGojuonRow('ガ'), 'K');
  assert.equal(getGojuonRow('か'), 'K');
  assert.equal(getGojuonRow('ポ'), 'H');
  assert.equal(getGojuonRow('は'), 'H');
  assert.equal(getGojuonRow('マ'), 'M');
  assert.equal(getGojuonRow('あ'), 'A');
});

test('isWin is an exact character match', () => {
  assert.equal(isWin(TARGET, TARGET), true);
  assert.equal(isWin(FIXTURE[1], TARGET), false);
});

test('dailyTarget is stable within a day and varies across days and modes', () => {
  const day = new Date('2026-09-12T08:00:00');
  const same = new Date('2026-09-12T23:00:00');

  // Daily Advanced
  const a = dailyTarget(FIXTURE, day);
  const b = dailyTarget(FIXTURE, same);
  assert.equal(a.kanji, b.kanji);

  // Daily Standard with JLPT option
  const stdN4 = dailyTarget(FIXTURE, day, { jlpt: 4 });
  assert.ok(stdN4);
  assert.equal(stdN4.jlpt, 4);

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
  assert.equal(cellToEmoji('near'), '🟨');
  assert.equal(cellToEmoji('wrong'), '⬜');
  assert.equal(cellToEmoji('unknown'), '⬜');
});

test('guessToEmojiRow converts 6 columns of feedback into a 6-emoji string', () => {
  const rowTarget = guessToEmojiRow(TARGET, TARGET);
  assert.equal(rowTarget, '🟩🟩🟩🟩🟩🟩');

  // FIXTURE[1] (暗) against TARGET (明):
  // kanji: 暗 vs 明 -> wrong (⬜)
  // strokes: 13 vs 8 -> lower (🟨)
  // radical: 72 vs 72 -> correct (🟩)
  // onyomi: アン vs メイ,ミョウ -> wrong (⬜)
  // kunyomi: くら.い vs あか.るい -> wrong (⬜)
  // origin: 形声 vs 会意 -> wrong (⬜)
  const rowFixture = guessToEmojiRow(FIXTURE[1], TARGET);
  assert.equal(rowFixture, '⬜🟨🟩⬜⬜⬜');
});

test('generateEmojiGrid creates multi-line 6-column emoji grid', () => {
  const grid = generateEmojiGrid([FIXTURE[1], TARGET], TARGET);
  const lines = grid.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], '⬜🟨🟩⬜⬜⬜');
  assert.equal(lines[1], '🟩🟩🟩🟩🟩🟩');
});

test('formatWordleShare builds correct daily and practice share messages', () => {
  const textStd = formatWordleShare({
    date: '2026-09-13',
    won: true,
    guesses: [FIXTURE[1], TARGET],
    target: TARGET,
    streak: 5,
    maxGuesses: 6,
    mode: 'daily-standard',
    jlpt: 4,
    url: 'https://daijoubu-jp.github.io/games/kanji-wordle.html',
  });

  assert.ok(textStd.includes('คันจิเวิร์ดเดิล (漢字・WORDLE) (Daily N4) 2026-09-13'));
  assert.ok(textStd.includes('2/6 · สตรีค 5 วัน'));
  assert.ok(textStd.includes('⬜🟨🟩⬜⬜⬜\n🟩🟩🟩🟩🟩🟩'));
  assert.ok(textStd.endsWith('https://daijoubu-jp.github.io/games/kanji-wordle.html'));

  const textAdv = formatWordleShare({
    date: '2026-09-13',
    won: true,
    guesses: [TARGET],
    target: TARGET,
    streak: 2,
    maxGuesses: 6,
    mode: 'daily-advanced',
  });
  assert.ok(textAdv.includes('คันจิเวิร์ดเดิล (漢字・WORDLE) (Daily Advanced) 2026-09-13'));
  assert.ok(textAdv.includes('1/6 · สตรีค 2 วัน'));
});

test('feedback clue discrimination: distinctive match excludes leading kanji column', () => {
  // Non-matching guess: 木 (strokes: 4, radical: 75, onyomi: ['モク'], kunyomi: ['き'], origin: '象形')
  const nonMatch = {
    kanji: '木',
    strokes: 4,
    radical: 75,
    radicalChar: '木',
    onyomi: ['モク'],
    kunyomi: ['き'],
    origin_type: '象形',
  };
  const cellsNonMatch = feedback(nonMatch, TARGET);
  // No clue matched TARGET (which has 8 strokes, radical 72, on: メイ/ミョウ, kun: あかるい, origin: 会意)
  const hasDistinctiveMatch = cellsNonMatch.some(
    (c) => c.id !== 'kanji' && c.state === 'correct'
  );
  assert.equal(hasDistinctiveMatch, false);

  // Partial match: 日 (shares radical 72)
  const cellsRadicalMatch = feedback(FIXTURE[2], TARGET);
  const hasRadicalClue = cellsRadicalMatch.some(
    (c) => c.id !== 'kanji' && c.state === 'correct'
  );
  assert.equal(hasRadicalClue, true);
});