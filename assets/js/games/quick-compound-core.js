/**
 * quick-compound-core.js
 * ----------------------
 * Pure logic for the Quick Compound game: choosing valid compounds and decoy
 * words, building rounds, and completion checks. No DOM access.
 */

import { shuffle } from './time-attack-core.js';

/**
 * Indices of compounds that contain the target kanji.
 * @param {{ words: string[][], byKanji: Record<string, number[]> }} data
 * @param {string} kanji
 * @param {number} count
 * @param {() => number} rng
 * @returns {number[]}
 */
export function pickValidIndices(data, kanji, count, rng = Math.random) {
  const indices = data.byKanji[kanji] || [];
  return shuffle(indices, rng).slice(0, Math.max(0, count));
}

/**
 * Indices of compounds that do NOT contain the target kanji.
 * @param {{ words: string[][] }} data
 * @param {string} kanji
 * @param {number} count
 * @param {() => number} rng
 * @returns {number[]}
 */
export function pickDecoyIndices(data, kanji, count, rng = Math.random) {
  const all = Array.from({ length: data.words.length }, (_unused, i) => i);
  const decoys = [];
  for (const index of shuffle(all, rng)) {
    if (data.words[index][0].includes(kanji)) continue;
    decoys.push(index);
    if (decoys.length >= count) break;
  }
  return decoys;
}

/**
 * Build one round for a target kanji.
 * @param {string} kanji
 * @param {{ words: string[][], byKanji: Record<string, number[]> }} data
 * @param {number} validCount
 * @param {number} decoyCount
 * @param {() => number} rng
 * @returns {{ kanji: string, valid: number[], tiles: number[] }}
 */
export function buildRound(kanji, data, validCount, decoyCount, rng = Math.random) {
  const valid = pickValidIndices(data, kanji, validCount, rng);
  const decoys = pickDecoyIndices(data, kanji, decoyCount, rng);
  return { kanji, valid, tiles: shuffle([...valid, ...decoys], rng) };
}

/**
 * Build a sequence of rounds, skipping kanji with no compounds.
 * @param {string[]} targets
 * @param {{ words: string[][], byKanji: Record<string, number[]> }} data
 * @param {number} count
 * @param {number} validCount
 * @param {number} decoyCount
 * @param {() => number} rng
 * @returns {Array<{ kanji: string, valid: number[], tiles: number[] }>}
 */
export function makeRounds(targets, data, count, validCount, decoyCount, rng = Math.random) {
  const usable = targets.filter((kanji) => (data.byKanji[kanji] || []).length > 0);
  return shuffle(usable, rng)
    .slice(0, Math.max(0, count))
    .map((kanji) => buildRound(kanji, data, validCount, decoyCount, rng));
}

/**
 * True when every valid compound has been selected.
 * @param {number[]} selected
 * @param {number[]} valid
 * @returns {boolean}
 */
export function isRoundComplete(selected, valid) {
  const set = new Set(selected);
  return valid.every((index) => set.has(index));
}
