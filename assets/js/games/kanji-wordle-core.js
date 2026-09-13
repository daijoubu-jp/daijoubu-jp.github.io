/**
 * kanji-wordle-core.js
 * --------------------
 * Pure deduction logic for Kanji Wordle: 6 hint categories
 * (คันจิ, จำนวนขีด, หมวดอักษร, 音読み, 訓読み, ที่มา),
 * per-attribute feedback, win check, and daily target.
 * No DOM access, so it is unit tested directly.
 */

import { getDailyKanjiFromIndex } from '../search.js';

/**
 * Gojūon consonant rows mapping for On'yomi / Kun'yomi matching.
 */
export const GOJUON_ROWS = {
  // A row (あ行)
  'ア': 'A', 'イ': 'A', 'ウ': 'A', 'エ': 'A', 'オ': 'A',
  'ァ': 'A', 'ィ': 'A', 'ゥ': 'A', 'ェ': 'A', 'ォ': 'A',
  // K row (か行 + が行)
  'カ': 'K', 'キ': 'K', 'ク': 'K', 'ケ': 'K', 'コ': 'K',
  'ガ': 'K', 'ギ': 'K', 'グ': 'K', 'ゲ': 'K', 'ゴ': 'K',
  // S row (さ行 + ざ行)
  'サ': 'S', 'シ': 'S', 'ス': 'S', 'セ': 'S', 'ソ': 'S',
  'ザ': 'S', 'ジ': 'S', 'ズ': 'S', 'ゼ': 'S', 'ゾ': 'S',
  // T row (た行 + だ行)
  'タ': 'T', 'チ': 'T', 'ツ': 'T', 'テ': 'T', 'ト': 'T',
  'ダ': 'T', 'ヂ': 'T', 'ヅ': 'T', 'デ': 'T', 'ド': 'T',
  // N row (な行)
  'ナ': 'N', 'ニ': 'N', 'ヌ': 'N', 'ネ': 'N', 'ノ': 'N',
  // H row (は行 + ば行 + ぱ行)
  'ハ': 'H', 'ヒ': 'H', 'フ': 'H', 'ヘ': 'H', 'ホ': 'H',
  'バ': 'H', 'ビ': 'H', 'ブ': 'H', 'ベ': 'H', 'ボ': 'H',
  'パ': 'H', 'ピ': 'H', 'プ': 'H', 'ペ': 'H', 'ポ': 'H',
  // M row (ま行)
  'マ': 'M', 'ミ': 'M', 'ム': 'M', 'メ': 'M', 'モ': 'M',
  // Y row (や行)
  'ヤ': 'Y', 'ユ': 'Y', 'ヨ': 'Y',
  'ャ': 'Y', 'ュ': 'Y', 'ョ': 'Y',
  // R row (ら行)
  'ラ': 'R', 'リ': 'R', 'ル': 'R', 'レ': 'R', 'ロ': 'R',
  // W row (わ行)
  'ワ': 'W', 'ヲ': 'W', 'ン': 'W',
};

/**
 * Returns the Gojūon consonant family for a given kana character.
 * @param {string} char
 * @returns {string|null}
 */
export function getGojuonRow(char) {
  if (!char) return null;
  const code = char.charCodeAt(0);
  let katakanaChar = char[0];
  // Convert Hiragana (U+3041..U+3096) to Katakana (U+30A1..U+30F6)
  if (code >= 0x3041 && code <= 0x3096) {
    katakanaChar = String.fromCharCode(code + 0x60);
  }
  return GOJUON_ROWS[katakanaChar] || null;
}

/**
 * Evaluates On'yomi feedback between guess and target.
 * @param {object} guess
 * @param {object} target
 * @returns {{ state: 'correct'|'near'|'wrong', display: string }}
 */
export function matchOnyomi(guess, target) {
  const gOns = Array.isArray(guess.onyomi) ? guess.onyomi : [];
  const tOns = Array.isArray(target.onyomi) ? target.onyomi : [];

  if (gOns.length === 0 && tOns.length === 0) {
    return { state: 'correct', display: '—' };
  }
  if (gOns.length === 0) {
    return { state: 'wrong', display: '—' };
  }
  if (tOns.length === 0) {
    return { state: 'wrong', display: gOns[0] };
  }

  // Exact shared on'yomi match
  const shared = gOns.find((r) => tOns.includes(r));
  if (shared) {
    return { state: 'correct', display: shared };
  }

  // Row match: primary on'yomi consonant row exists in target on'yomi
  const gRow = getGojuonRow(gOns[0]);
  const tRows = new Set(tOns.map((r) => getGojuonRow(r)).filter(Boolean));
  if (gRow && tRows.has(gRow)) {
    return { state: 'near', display: gOns[0] };
  }

  return { state: 'wrong', display: gOns[0] };
}

/**
 * Strips okurigana delimiter dot from Kun'yomi.
 * @param {string} k
 * @returns {string}
 */
function normalizeKun(k) {
  return k ? k.replace(/\./g, '') : '';
}

/**
 * Gets the stem (part before the okurigana dot) of Kun'yomi.
 * @param {string} k
 * @returns {string}
 */
function getKunStem(k) {
  return k ? k.split('.')[0] : '';
}

/**
 * Evaluates Kun'yomi feedback between guess and target.
 * @param {object} guess
 * @param {object} target
 * @returns {{ state: 'correct'|'near'|'wrong', display: string }}
 */
export function matchKunyomi(guess, target) {
  const gKuns = Array.isArray(guess.kunyomi) ? guess.kunyomi : [];
  const tKuns = Array.isArray(target.kunyomi) ? target.kunyomi : [];

  if (gKuns.length === 0 && tKuns.length === 0) {
    return { state: 'correct', display: '—' };
  }
  if (gKuns.length === 0) {
    return { state: 'wrong', display: '—' };
  }
  if (tKuns.length === 0) {
    return { state: 'wrong', display: gKuns[0] };
  }

  // Exact match: full normalized reading or root stem
  const tNorms = new Set(tKuns.map(normalizeKun));
  const tStems = new Set(tKuns.map(getKunStem));

  for (const gk of gKuns) {
    const norm = normalizeKun(gk);
    const stem = getKunStem(gk);
    if (tNorms.has(norm) || (stem && tStems.has(stem))) {
      return { state: 'correct', display: gk };
    }
  }

  // Near match: initial mora / kana match
  const gFirst = gKuns[0][0];
  const tFirsts = new Set(tKuns.map((k) => k[0]));
  if (tFirsts.has(gFirst)) {
    return { state: 'near', display: gKuns[0] };
  }

  return { state: 'wrong', display: gKuns[0] };
}

/**
 * Normalizes origin label (e.g. 象形文字 -> 象形).
 * @param {string} origin
 * @returns {string}
 */
function normalizeOrigin(origin) {
  if (!origin) return '—';
  for (const prefix of ['象形', '指事', '会意', '形声']) {
    if (origin.includes(prefix)) return prefix;
  }
  return origin;
}

/**
 * Evaluates Origin (六書) feedback between guess and target.
 * @param {object} guess
 * @param {object} target
 * @returns {{ state: 'correct'|'wrong', display: string }}
 */
export function matchOrigin(guess, target) {
  const gOrig = normalizeOrigin(guess.origin_type);
  const tOrig = normalizeOrigin(target.origin_type);

  const isMatch = gOrig !== '—' && tOrig !== '—' && gOrig === tOrig;
  return {
    state: isMatch ? 'correct' : 'wrong',
    display: gOrig,
  };
}

/**
 * 6 Hint Columns for Kanji Wordle:
 * [คันจิ] [จำนวนขีด] [หมวดอักษร] [音読み] [訓読み] [ที่มา]
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
    id: 'onyomi',
    label: '音読み',
    cell: (guess, target) => matchOnyomi(guess, target),
  },
  {
    id: 'kunyomi',
    label: '訓読み',
    cell: (guess, target) => matchKunyomi(guess, target),
  },
  {
    id: 'origin',
    label: 'ที่มา',
    cell: (guess, target) => matchOrigin(guess, target),
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
 * @param {object} [options]
 * @param {number} [options.jlpt] - JLPT level (1-5) for Standard Daily
 * @returns {object|null}
 */
export function dailyTarget(pool, date = new Date(), options = {}) {
  let subPool = pool;
  let salt = '';
  if (options && options.jlpt) {
    const level = Number(options.jlpt);
    subPool = pool.filter((k) => Number(k.jlpt) === level);
    salt = `-jlpt-n${level}`;
  } else {
    salt = '-advanced';
  }
  if (!subPool || subPool.length === 0) {
    subPool = pool;
    salt = '';
  }
  return getDailyKanjiFromIndex(subPool, date, salt);
}

/**
 * Band representing all Joyo kanji for practice / advanced mode.
 */
export const ALL_JOYO_BAND = Object.freeze({
  id: 'all-joyo',
  label: 'รวมคันจิโจโยทั้งหมด',
  match: (entry) => Boolean(entry.joyo),
});

/**
 * Convert a feedback cell state into an emoji.
 * 🟩 for correct, 🟨 for higher/lower/near, ⬜ for wrong.
 * @param {string} state
 * @returns {string}
 */
export function cellToEmoji(state) {
  if (state === 'correct') return '🟩';
  if (state === 'higher' || state === 'lower' || state === 'near') return '🟨';
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
 * @param {string} [params.mode='daily-standard']
 * @param {number|null} [params.jlpt=null]
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
  jlpt = null,
  url = 'https://daijoubu-jp.github.io/games/kanji-wordle.html',
} = {}) {
  const count = guessCount !== null ? guessCount : guesses.length;
  const guessCountStr = won ? `${count}/${maxGuesses}` : `X/${maxGuesses}`;

  let modeLabel = '';
  if (mode === 'daily-standard' || (mode === 'daily' && jlpt)) {
    modeLabel = ` (Daily N${jlpt})`;
  } else if (mode === 'daily-advanced' || mode === 'daily') {
    modeLabel = ' (Daily Advanced)';
  } else if (mode === 'practice-standard' || (mode === 'practice' && jlpt)) {
    modeLabel = ` (Practice N${jlpt})`;
  } else {
    modeLabel = ' (Practice Advanced)';
  }

  const title = `คันจิเวิร์ดเดิล (漢字・WORDLE)${modeLabel} ${date}`.trim();
  const lines = [title];

  if (mode.startsWith('daily')) {
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