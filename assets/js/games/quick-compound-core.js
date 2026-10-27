/**
 * quick-compound-core.js
 * ----------------------
 * Pure logic for the Quick Compound game: choosing valid compounds and decoy
 * words, building rounds, and completion checks. No DOM access.
 */

import { shuffle } from './time-attack-core.js';

/**
 * Indices of compounds that contain the target kanji, prioritizing those with Thai meanings.
 * @param {{ words: string[][], byKanji: Record<string, number[]> }} data
 * @param {string} kanji
 * @param {number} count
 * @param {() => number} rng
 * @returns {number[]}
 */
export function pickValidIndices(data, kanji, count, rng = Math.random) {
  const indices = data.byKanji[kanji] || [];
  const withThai = [];
  const withoutThai = [];
  for (const idx of indices) {
    const word = data.words[idx];
    if (word && word[3]) withThai.push(idx);
    else withoutThai.push(idx);
  }
  const ordered = [...shuffle(withThai, rng), ...shuffle(withoutThai, rng)];
  return ordered.slice(0, Math.max(0, count));
}

/**
 * Indices of compounds that do NOT contain the target kanji, prioritizing those with Thai meanings.
 * @param {{ words: string[][] }} data
 * @param {string} kanji
 * @param {number} count
 * @param {() => number} rng
 * @returns {number[]}
 */
export function pickDecoyIndices(data, kanji, count, rng = Math.random) {
  const targetCount = Math.max(0, count);
  if (targetCount === 0) return [];
  const all = Array.from({ length: data.words.length }, (_unused, i) => i);
  const shuffled = shuffle(all, rng);
  const decoys = [];
  const fallback = [];

  for (const index of shuffled) {
    const entry = data.words[index];
    if (!entry || entry[0].includes(kanji)) continue;
    if (entry[3]) {
      decoys.push(index);
      if (decoys.length >= targetCount) return decoys;
    } else if (decoys.length + fallback.length < targetCount * 2) {
      fallback.push(index);
    }
  }

  for (const index of fallback) {
    if (decoys.length >= targetCount) break;
    decoys.push(index);
  }
  return decoys;
}

/**
 * Mask a compound surface with '□' so players cannot simply spot the target kanji visually.
 * - Valid compounds: replaces all occurrences of `targetKanji` with '□'.
 * - Decoy compounds: replaces one character (selected via `rng`) with '□'.
 * @param {string} surface
 * @param {string} targetKanji
 * @param {() => number} [rng=Math.random]
 * @returns {string}
 */
export function maskCompoundSurface(surface, targetKanji, rng = Math.random) {
  if (!surface) return '';
  const chars = Array.from(surface);
  if (chars.includes(targetKanji)) {
    return chars.map((ch) => (ch === targetKanji ? '□' : ch)).join('');
  }
  if (chars.length === 0) return '';
  const idx = Math.min(chars.length - 1, Math.max(0, Math.floor(rng() * chars.length)));
  chars[idx] = '□';
  return chars.join('');
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
