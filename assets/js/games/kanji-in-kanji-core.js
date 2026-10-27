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

export const RADICAL_VARIANT_GLOSS_TH = {
  '⺅': 'คน (亻)',
  '𠆢': 'หลังคา/คน',
  '⺌': 'เล็ก/แสง',
  '⺹': 'ชรา (耂)',
  '⺾': 'หญ้า/พืช (艹)',
  '⻏': 'เมือง/เนิน (阝)',
  '⻖': 'เนิน/กำแพง (阝)',
  '氵': 'น้ำ (水)',
  '扌': 'มือ (手)',
  '忄': 'หัวใจ (心)',
  '灬': 'ไฟ (火)',
  '礻': 'เทพ/พิธี (示)',
  '衤': 'เสื้อผ้า (衣)',
  '犭': 'สัตว์สี่เท้า (犬)',
  '刂': 'มีด/ดาบ (刀)',
  '罒': 'ตาข่าย (网)',
  '辶': 'เดิน/ทาง (辶)',
  '宀': 'หลังคาบ้าน',
  '冖': 'ผ้าคลุม',
  '冫': 'น้ำแข็ง',
  '广': 'อาคาร/หลังคา',
  '疒': 'โรคภัย',
  '彳': 'ก้าวเดิน',
  '彡': 'ลวดลาย/ขน',
  '攵': 'เคาะ/ตี',
  '囗': 'ล้อมรอบ',
  '門': 'ประตู',
};

/**
 * Look up a short Thai gloss for a component character using radical variant
 * fallbacks and the search index meaning map.
 * @param {string} component
 * @param {Map<string, string> | Record<string, string>} [meaningMap]
 * @returns {string}
 */
export function getComponentGloss(component, meaningMap = null) {
  if (!component) return '';
  if (RADICAL_VARIANT_GLOSS_TH[component]) {
    return RADICAL_VARIANT_GLOSS_TH[component];
  }
  if (meaningMap) {
    if (typeof meaningMap.get === 'function') {
      return meaningMap.get(component) || '';
    }
    return meaningMap[component] || '';
  }
  return '';
}
