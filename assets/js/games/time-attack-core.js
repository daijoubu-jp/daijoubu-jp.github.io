/**
 * time-attack-core.js
 * -------------------
 * Pure logic for the Kanji Time Attack game: band selection, distractor
 * picking, question generation, and scoring. No DOM access, so it is unit
 * tested directly.
 */

/**
 * Selectable question pools. `match` receives a kanji index entry.
 */
export const BANDS = [
  { id: 'n5', label: 'JLPT N5', match: (e) => e.jlpt === 5 },
  { id: 'n4', label: 'JLPT N4', match: (e) => e.jlpt === 4 },
  { id: 'n3', label: 'JLPT N3', match: (e) => e.jlpt === 3 },
  { id: 'n2', label: 'JLPT N2', match: (e) => e.jlpt === 2 },
  { id: 'n1', label: 'JLPT N1', match: (e) => e.jlpt === 1 },
  { id: 'elementary', label: 'ประถม 1-6', match: (e) => e.grade >= 1 && e.grade <= 6 },
  { id: 'mid', label: 'มัธยมต้น', match: (e) => ['4', '3'].includes(String(e.kanken)) },
  { id: 'high', label: 'มัธยมปลาย', match: (e) => ['jun2', '2'].includes(String(e.kanken)) },
  { id: 'univ', label: 'อุดมศึกษาขึ้นไป', match: (e) => ['jun1', '1'].includes(String(e.kanken)) },
];

/**
 * Primary display meaning for an entry (Thai first, English fallback).
 * @param {object} entry
 * @returns {string}
 */
export function primaryMeaning(entry) {
  return (entry.meanings_th && entry.meanings_th[0])
    || (entry.meanings_en && entry.meanings_en[0])
    || '';
}

/**
 * Fisher-Yates shuffle on a copy.
 * @template T
 * @param {T[]} list
 * @param {() => number} rng
 * @returns {T[]}
 */
export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Filter the dataset to a band's pool, keeping only entries with a meaning.
 * @param {object[]} entries
 * @param {string} bandId
 * @returns {object[]}
 */
export function filterPool(entries, bandId) {
  const band = BANDS.find((b) => b.id === bandId);
  if (!band) return [];
  return entries.filter((e) => primaryMeaning(e) && band.match(e));
}

/**
 * Pick up to `n` distinct meanings that are not the correct answer.
 * @param {object[]} pool
 * @param {string} correctMeaning
 * @param {number} n
 * @param {() => number} rng
 * @returns {string[]}
 */
export function pickDistractors(pool, correctMeaning, n, rng = Math.random) {
  const seen = new Set([correctMeaning]);
  const distractors = [];

  for (const entry of shuffle(pool, rng)) {
    const meaning = primaryMeaning(entry);
    if (!meaning || seen.has(meaning)) continue;
    seen.add(meaning);
    distractors.push(meaning);
    if (distractors.length >= n) break;
  }
  return distractors;
}

/**
 * Build a round of questions. Each question has the kanji, its correct
 * primary meaning, and a shuffled set of up to 4 unique options.
 * @param {object[]} pool
 * @param {number} count
 * @param {() => number} rng
 * @returns {{kanji: string, correct: string, options: string[]}[]}
 */
export function makeQuestions(pool, count, rng = Math.random) {
  const valid = pool.filter((e) => primaryMeaning(e));
  const chosen = shuffle(valid, rng).slice(0, Math.max(0, count));

  return chosen.map((entry) => {
    const correct = primaryMeaning(entry);
    const options = shuffle(
      [correct, ...pickDistractors(valid, correct, 3, rng)],
      rng
    );
    return { kanji: entry.kanji, correct, options };
  });
}

/**
 * Compare a score with the previous best.
 * @param {number} score
 * @param {number} previousBest
 * @returns {{ best: number, isNewBest: boolean }}
 */
export function scoreResult(score, previousBest) {
  const best = Math.max(score, previousBest || 0);
  return { best, isNewBest: score > (previousBest || 0) };
}
