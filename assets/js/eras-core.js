/**
 * eras-core.js
 * ------------
 * Pure, testable helpers for the Eras of Japan (日本の時代・年号) feature:
 * 3-way year conversion (ค.ศ. ↔ พ.ศ. ↔ ปีรัชศกญี่ปุ่น 和暦), historical period
 * lookup, Gengo year formatting (元年 handling), and kanji extraction.
 */

export const MACRO_ERAS = [
  { id: 'all', labelJa: 'すべて', labelTh: 'ทั้งหมด (15 ยุค)' },
  { id: 'ancient', labelJa: '原始・古代', labelTh: 'ยุคดึกดำบรรพ์ & โบราณ' },
  { id: 'medieval', labelJa: '中世', labelTh: 'ยุคกลาง (ซามูไรยุคแรก)' },
  { id: 'early-modern', labelJa: '近世', labelTh: 'ยุคก่อนสมัยใหม่' },
  { id: 'modern', labelJa: '近現代', labelTh: 'ยุคสมัยใหม่ & ร่วมสมัย' },
];

/**
 * Format a Gengo year number in Japanese (1 -> 元年, n -> n年).
 * @param {string} nameJa
 * @param {number} yearNum
 * @returns {string}
 */
export function formatGengoYearJa(nameJa, yearNum) {
  if (!nameJa || !Number.isFinite(yearNum) || yearNum < 1) return '';
  return `${nameJa}${yearNum === 1 ? '元年' : `${yearNum}年`}`;
}

/**
 * Format a Gengo year number in Thai.
 * @param {string} nameTh
 * @param {number} yearNum
 * @returns {string}
 */
export function formatGengoYearTh(nameTh, yearNum) {
  if (!nameTh || !Number.isFinite(yearNum) || yearNum < 1) return '';
  return yearNum === 1
    ? `ปี${nameTh}ที่ 1 (ปีแรก / 元年)`
    : `ปี${nameTh}ที่ ${yearNum}`;
}

/**
 * Convert a Western (CE / ค.ศ.) year into Buddhist Era (พ.ศ.), matching
 * Japanese Gengo (和暦 — including transition years like 1912, 1926, 1989, 2019),
 * and matching historical periods (時代).
 * @param {number} ceYear
 * @param {{ periods?: Array<object>, gengo?: Array<object> }} erasData
 * @returns {{
 *   ceYear: number,
 *   beYear: number,
 *   ceLabelTh: string,
 *   beLabelTh: string,
 *   gengoMatches: Array<{ id: string, name_ja: string, name_th: string, year: number, labelJa: string, labelTh: string }>,
 *   periodMatches: Array<object>
 * } | null}
 */
export function convertFromWesternYear(ceYear, erasData) {
  const year = Math.trunc(Number(ceYear));
  if (!Number.isFinite(year) || year === 0) return null;

  const beYear = year + 543;
  const ceLabelTh = year < 0 ? `${Math.abs(year)} ปีก่อน ค.ศ.` : `ค.ศ. ${year}`;
  const beLabelTh = beYear <= 0 ? `ก่อน พ.ศ. ${Math.abs(beYear) + 1} ปี` : `พ.ศ. ${beYear}`;

  const gengoList = erasData?.gengo || [];
  const periodList = erasData?.periods || [];

  const gengoMatches = [];
  for (const g of gengoList) {
    const inStart = year >= g.start_year;
    const inEnd = g.end_year === null ? true : year <= g.end_year;
    if (inStart && inEnd) {
      const gYear = year - g.start_year + 1;
      gengoMatches.push({
        id: g.id,
        name_ja: g.name_ja,
        name_hira: g.name_hira,
        name_th: g.name_th,
        year: gYear,
        labelJa: formatGengoYearJa(g.name_ja, gYear),
        labelTh: formatGengoYearTh(g.name_th, gYear),
      });
    }
  }

  const periodMatches = periodList.filter((p) => {
    const inStart = year >= p.start_year;
    const inEnd = p.end_year === null ? true : year <= p.end_year;
    return inStart && inEnd;
  });

  return {
    ceYear: year,
    beYear,
    ceLabelTh,
    beLabelTh,
    gengoMatches,
    periodMatches,
  };
}

/**
 * Convert a Thai Buddhist Era (พ.ศ.) year into Western, Gengo, and Historical Period.
 * @param {number} beYear
 * @param {{ periods?: Array<object>, gengo?: Array<object> }} erasData
 * @returns {ReturnType<typeof convertFromWesternYear>}
 */
export function convertFromBuddhistYear(beYear, erasData) {
  const be = Math.trunc(Number(beYear));
  if (!Number.isFinite(be)) return null;
  const ceYear = be - 543;
  if (ceYear === 0) return null;
  return convertFromWesternYear(ceYear, erasData);
}

/**
 * Convert a Japanese Gengo ID + Era Year (e.g. 'showa', 64 or 'reiwa', 1) into
 * Western (ค.ศ.), Buddhist (พ.ศ.), and matching eras.
 * @param {string} gengoId
 * @param {number} gengoYear
 * @param {{ periods?: Array<object>, gengo?: Array<object> }} erasData
 * @returns {ReturnType<typeof convertFromWesternYear>}
 */
export function convertFromGengo(gengoId, gengoYear, erasData) {
  const gengoList = erasData?.gengo || [];
  const gengo = gengoList.find((g) => g.id === gengoId);
  if (!gengo) return null;

  const y = Math.max(1, Math.trunc(Number(gengoYear) || 1));
  const maxYear = gengo.end_year !== null ? gengo.end_year - gengo.start_year + 1 : 200;
  const clampedYear = Math.min(y, maxYear);
  const ceYear = gengo.start_year + clampedYear - 1;
  return convertFromWesternYear(ceYear, erasData);
}

/**
 * Extract unique CJK Kanji characters from a string in order of first appearance.
 * @param {string} text
 * @returns {string[]}
 */
export function extractUniqueKanji(text) {
  if (!text) return [];
  const seen = new Set();
  const out = [];
  for (const ch of Array.from(String(text))) {
    if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
}
