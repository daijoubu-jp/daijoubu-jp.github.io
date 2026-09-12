/**
 * kanji-in-kanji-core.js
 * ----------------------
 * Pure logic for the Kanji in Kanji game: decoy picking, puzzle building and
 * completion checks. No DOM access, so it is unit tested directly.
 */

import { shuffle } from './time-attack-core.js';

/**
 * Pick distinct decoy components that are not part of the answer.
 * @param {string[]} pool All known components
 * @param {string[]} realComponents The correct answer set
 * @param {number} n How many decoys to aim for
 * @param {() => number} rng
 * @returns {string[]}
 */
export function pickDecoys(pool, realComponents, n, rng = Math.random) {
  const real = new Set(realComponents);
  const decoys = [];

  for (const component of shuffle(pool, rng)) {
    if (!component || real.has(component) || decoys.includes(component)) continue;
    decoys.push(component);
    if (decoys.length >= n) break;
  }
  return decoys;
}

/**
 * Build one puzzle: the target kanji plus shuffled tiles (real parts + decoys).
 * @param {string} kanji
 * @param {string[]} components
 * @param {string[]} pool
 * @param {number} decoyCount
 * @param {() => number} rng
 * @returns {{ kanji: string, components: string[], tiles: string[] }}
 */
export function buildPuzzle(kanji, components, pool, decoyCount = 4, rng = Math.random) {
  const decoys = pickDecoys(pool, components, decoyCount, rng);
  return {
    kanji,
    components: [...components],
    tiles: shuffle([...components, ...decoys], rng),
  };
}

/**
 * Build a round of puzzles from candidate targets.
 * @param {string[]} targets Canonical kanji strings
 * @param {Record<string, string[]>} entries Decomposition map
 * @param {string[]} pool
 * @param {number} count
 * @param {number} decoyCount
 * @param {() => number} rng
 * @returns {Array<{ kanji: string, components: string[], tiles: string[] }>}
 */
export function makePuzzles(targets, entries, pool, count, decoyCount = 4, rng = Math.random) {
  const usable = targets.filter((kanji) => entries[kanji] && entries[kanji].length >= 2);
  return shuffle(usable, rng)
    .slice(0, Math.max(0, count))
    .map((kanji) => buildPuzzle(kanji, entries[kanji], pool, decoyCount, rng));
}

/**
 * True when every real component has been selected.
 * @param {string[]} selected
 * @param {string[]} components
 * @returns {boolean}
 */
export function isComplete(selected, components) {
  const set = new Set(selected);
  return components.every((component) => set.has(component));
}
