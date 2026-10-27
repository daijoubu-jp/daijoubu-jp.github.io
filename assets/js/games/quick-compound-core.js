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
 *
 * startGame() builds 400 rounds in one synchronous burst, so this runs 400
 * times per difficulty band against a ~17.8k-word dataset. Materialising and
 * shuffling the full index array per call cost ~360 ms of main-thread time and
 * froze the UI on band selection. The word pool is split once per dataset and
 * cached; each call then draws by random probing, which is O(count).
 *
 * @param {{ words: string[][] }} data
 * @param {string} kanji
 * @param {number} count
 * @param {() => number} rng
 * @returns {number[]}
 */
export function pickDecoyIndices(data, kanji, count, rng = Math.random) {
  const targetCount = Math.max(0, count);
  if (targetCount === 0) return [];

  const words = data.words || [];
  if (words.length === 0) return [];

  const { preferred, fallback } = decoyPool(data);
  const decoys = [];

  // Draw from Thai-glossed compounds first, then from the rest, exactly as the
  // previous shuffled-scan version did.
  drawFrom(preferred, words, kanji, targetCount, rng, decoys);
  if (decoys.length < targetCount) {
    drawFrom(fallback, words, kanji, targetCount, rng, decoys);
  }
  return decoys;
}

/** Cache of the decoy word pool, keyed on the words array identity. */
let poolCache = { source: null, preferred: [], fallback: [] };

/**
 * Split every compound index into Thai-glossed and glossless buckets, once.
 * @param {{ words: string[][] }} data
 * @returns {{ preferred: number[], fallback: number[] }}
 */
function decoyPool(data) {
  if (poolCache.source === data.words) return poolCache;

  const preferred = [];
  const fallback = [];
  const words = data.words || [];
  for (let i = 0; i < words.length; i += 1) {
    const entry = words[i];
    if (!entry) continue;
    if (entry[3]) preferred.push(i);
    else fallback.push(i);
  }

  poolCache = { source: data.words, preferred, fallback };
  return poolCache;
}

/**
 * Draw up to `need` distinct indices from `pool` by random probing, skipping
 * entries that contain the target kanji or were already drawn.
 * @param {number[]} pool
 * @param {string[][]} words
 * @param {string} kanji
 * @param {number} need
 * @param {() => number} rng
 * @param {number[]} out accumulates results
 */
function drawFrom(pool, words, kanji, need, rng, out) {
  if (pool.length === 0) return;

  const taken = new Set(out);
  // Bounded so a pool that is almost entirely target-bearing cannot spin.
  const maxTries = Math.max(32, need * 24);
  for (let tries = 0; out.length < need && tries < maxTries; tries += 1) {
    const index = pool[Math.floor(rng() * pool.length)];
    if (taken.has(index)) continue;
    const entry = words[index];
    if (!entry || entry[0].includes(kanji)) continue;
    taken.add(index);
    out.push(index);
  }
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
