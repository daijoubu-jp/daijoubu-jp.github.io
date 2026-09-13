/**
 * kanji-wordle-core.js
 * --------------------
 * Pure deduction logic for Kanji Wordle: per-attribute feedback, win check and
 * the daily target. No DOM access, so it is unit tested directly.
 */

import { getDailyKanjiFromIndex } from '../search.js';

/**
 * Kanken difficulty order (higher rank = harder).
 */
export const KANKEN_ORDER = {
  '10': 1, '9': 2, '8': 3, '7': 4, '6': 5, '5': 6,
  '4': 7, '3': 8, 'jun2': 9, '2': 10, 'jun1': 11, '1': 12,
};

/**
 * Kanken rank for an entry, or null when it has none.
 * @param {object} entry
 * @returns {number|null}
 */
export function kankenRank(entry) {
  const rank = KANKEN_ORDER[String(entry.kanken)];
  return rank === undefined ? null : rank;
}

/**
 * School-stage order: grades 1-6, then joyo secondary (grade 8) as ม.ต้น.
 * @param {object} entry
 * @returns {number|null}
 */
export function stageRank(entry) {
  if (entry.grade >= 1 && entry.grade <= 6) return entry.grade;
  if (entry.grade === 8) return 7;
  return null;
}

/**
 * JLPT rank (N5 easiest = 1 … N1 hardest = 5), or null.
 * @param {object} entry
 * @returns {number|null}
 */
export function jlptRank(entry) {
  return entry.jlpt ? 6 - entry.jlpt : null;
}

/**
 * Compare two numeric ranks where a higher rank means a harder target.
 * @param {number|null} guessRank
 * @param {number|null} targetRank
 * @returns {'correct'|'higher'|'lower'|'wrong'}
 */
function rankState(guessRank, targetRank) {
  if (guessRank === null || targetRank === null) return 'wrong';
  if (guessRank === targetRank) return 'correct';
  return targetRank > guessRank ? 'higher' : 'lower';
}

function stageLabel(entry) {
  if (entry.grade >= 1 && entry.grade <= 6) return `ป.${entry.grade}`;
  if (entry.grade === 8) return 'ม.ต้น';
  return '—';
}

/**
 * Hint columns. Each `cell(guess, target)` returns `{ state, display }`.
 */
export const COLUMNS = [
  {
    id: 'kanji',
    label: 'คันจิ',
    cell: (guess, target) => ({
      state: guess.kanji === target.kanji ? 'correct' : 'wrong',
      display: guess.kanji,
    }),
  },
  {
    id: 'strokes',
    label: 'จำนวนขีด',
    cell: (guess, target) => ({
      state: guess.strokes === target.strokes ? 'correct'
        : (target.strokes > guess.strokes ? 'higher' : 'lower'),
      display: guess.strokes,
    }),
  },
  {
    id: 'radical',
    label: 'หมวดอักษร',
    cell: (guess, target) => ({
      state: Number(guess.radical) === Number(target.radical) ? 'correct' : 'wrong',
      display: guess.radicalChar || '—',
    }),
  },
  {
    id: 'kanken',
    label: 'ระดับคันเค็น',
    cell: (guess, target) => ({
      state: rankState(kankenRank(guess), kankenRank(target)),
      display: guess.kanken ? `${guess.kanken}級` : '—',
    }),
  },
  {
    id: 'jlpt',
    label: 'JLPT',
    cell: (guess, target) => ({
      state: rankState(jlptRank(guess), jlptRank(target)),
      display: guess.jlpt ? `N${guess.jlpt}` : '—',
    }),
  },
  {
    id: 'stage',
    label: 'ระดับชั้นเรียน',
    cell: (guess, target) => ({
      state: rankState(stageRank(guess), stageRank(target)),
      display: stageLabel(guess),
    }),
  },
  {
    id: 'joyo',
    label: '常用 / 表外',
    cell: (guess, target) => ({
      state: Boolean(guess.joyo) === Boolean(target.joyo) ? 'correct' : 'wrong',
      display: guess.joyo ? '常用' : '表外',
    }),
  },
];

/**
 * Per-column feedback for one guess against the target.
 * @param {object} guess
 * @param {object} target
 * @returns {Array<{ id: string, label: string, state: string, display: string|number }>}
 */
export function feedback(guess, target) {
  return COLUMNS.map((column) => {
    const { state, display } = column.cell(guess, target);
    return { id: column.id, label: column.label, state, display };
  });
}

/**
 * True when the guess is the target kanji.
 * @param {object} guess
 * @param {object} target
 * @returns {boolean}
 */
export function isWin(guess, target) {
  return guess.kanji === target.kanji;
}

/**
 * Deterministic daily target from a pool.
 * @param {object[]} pool
 * @param {Date} [date]
 * @returns {object|null}
 */
export function dailyTarget(pool, date = new Date()) {
  return getDailyKanjiFromIndex(pool, date);
}

/**
 * Band representing all Joyo kanji for practice mode.
 */
export const ALL_JOYO_BAND = Object.freeze({
  id: 'all-joyo',
  label: 'รวมคันจิโจโยทั้งหมด',
  match: (entry) => Boolean(entry.joyo),
});

/**
 * Convert a feedback cell state into an emoji.
 * 🟩 for correct, 🟨 for higher/lower, ⬜ for wrong.
 * @param {string} state
 * @returns {string}
 */
export function cellToEmoji(state) {
  if (state === 'correct') return '🟩';
  if (state === 'higher' || state === 'lower') return '🟨';
  return '⬜';
}

/**
 * Generates an emoji row for one guess against the target.
 * @param {object} guess
 * @param {object} target
 * @returns {string}
 */
export function guessToEmojiRow(guess, target) {
  return feedback(guess, target).map((c) => cellToEmoji(c.state)).join('');
}

/**
 * Generates the full emoji grid string for an array of guesses.
 * @param {object[]} guesses
 * @param {object} target
 * @returns {string}
 */
export function generateEmojiGrid(guesses, target) {
  if (!Array.isArray(guesses) || !target) return '';
  return guesses.map((g) => guessToEmojiRow(g, target)).join('\n');
}

/**
 * Formats the full shareable message text.
 * @param {object} params
 * @param {string} [params.date] - YYYY-MM-DD
 * @param {boolean} params.won
 * @param {object[]} [params.guesses]
 * @param {number} [params.guessCount]
 * @param {object} [params.target]
 * @param {number} [params.streak]
 * @param {number} [params.maxGuesses=6]
 * @param {string} [params.mode='daily']
 * @param {string} [params.url]
 * @returns {string}
 */
export function formatWordleShare({
  date = '',
  won = false,
  guesses = [],
  guessCount = null,
  target = null,
  streak = 0,
  maxGuesses = 6,
  mode = 'daily',
  url = 'https://daijoubu-jp.github.io/games/kanji-wordle.html',
} = {}) {
  const count = guessCount !== null ? guessCount : guesses.length;
  const guessCountStr = won ? `${count}/${maxGuesses}` : `X/${maxGuesses}`;
  const title = mode === 'daily'
    ? `คันจิเวิร์ดเดิล (漢字・WORDLE) ${date}`.trim()
    : 'คันจิเวิร์ดเดิล (漢字・WORDLE) ฝึกฝน';

  const lines = [title];

  if (mode === 'daily') {
    lines.push(`${guessCountStr} · สตรีค ${streak} วัน`);
  } else {
    lines.push(won ? `ชนะใน ${count} ครั้ง` : 'หมดโอกาส');
  }

  const grid = generateEmojiGrid(guesses, target);
  if (grid) {
    lines.push('');
    lines.push(grid);
  }

  lines.push('');
  lines.push(url);

  return lines.join('\n');
}