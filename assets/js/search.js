/**
 * search.js
 * ---------
 * Data fetching, caching, filtering and smart search (Kanji, Kana, Romaji, English, Thai).
 */

let cachedKanjiData = null;

/**
 * Load the modular kanji datasets concurrently with bundle fallback.
 * @returns {Promise<Array>}
 */
export async function loadKanjiData() {
  if (cachedKanjiData) return cachedKanjiData;

  try {
    // 🚀 Load the optimized, minified bundle (1 HTTP request instead of 12)
    const dataUrl = new URL('../../data/kanji.min.json?v=1788410559', import.meta.url).href;
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    cachedKanjiData = await res.json();
  } catch (err) {
    console.error('Fatal: Failed to load kanji.min.json. Did you forget to run scripts/build-data.py?', err);
    cachedKanjiData = [];
  }

  return cachedKanjiData;
}

/**
 * Check if a character is a CJK Kanji.
 */
export function isKanji(char) {
  return /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(char);
}

/**
 * Check if a string is Japanese Kana (Hiragana / Katakana).
 */
export function isKana(str) {
  return /^[\u3040-\u309F\u30A0-\u30FF\u30FC\s]+$/.test(str);
}

/**
 * Check if string contains Thai characters.
 */
export function isThai(str) {
  return /[\u0E00-\u0E7F]/.test(str);
}

/**
 * Convert Romaji string to Hiragana.
 */
export function romajiToHiragana(str) {
  if (!str) return '';
  const map = {
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'shi': 'し', 'chi': 'ち', 'tsu': 'つ', 'fu': 'ふ',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'
  };

  let res = str.toLowerCase();
  for (const [rom, kana] of Object.entries(map)) {
    res = res.replaceAll(rom, kana);
  }
  return res;
}

/**
 * Convert Hiragana to Katakana for uniform reading match.
 */
function toKatakana(str) {
  return (str || '').replace(/[\u3041-\u3096]/g, match =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );
}

/**
 * Search the dataset with multi-language smart scoring.
 * @param {string} query
 * @param {object} [options]
 * @returns {Promise<Array>}
 */
export async function searchKanji(query, options = {}) {
  const data = await loadKanjiData();
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const limit = options.limit || 50;
  const qKana = romajiToHiragana(q);
  const qKata = toKatakana(qKana);

  const scoredResults = [];

  for (const item of data) {
    let score = 0;

    // 1. Exact Kanji match (highest priority)
    if (item.kanji === q) {
      score += 300;
    } else if (item.kanji.includes(q)) {
      score += 120;
    }

    // 2. Readings match (Onyomi / Kunyomi - Table & Hyougai)
    const joyoOn = (item.onyomi || []).join(' ');
    const joyoKun = (item.kunyomi || []).map(k => k.replace(/\./g, '')).join(' ');
    const hyougaiOn = (item.onyomi_hyougai || []).join(' ');
    const hyougaiKun = (item.kunyomi_hyougai || []).map(k => k.replace(/\./g, '')).join(' ');

    const joyoKunKata = toKatakana(joyoKun);
    const hyougaiKunKata = toKatakana(hyougaiKun);

    if (joyoOn === qKata || joyoKunKata === qKata) {
      score += 150;
    } else if (joyoOn.includes(qKata) || joyoKunKata.includes(qKata)) {
      score += 95;
    } else if (hyougaiOn === qKata || hyougaiKunKata === qKata) {
      score += 120;
    } else if (hyougaiOn.includes(qKata) || hyougaiKunKata.includes(qKata)) {
      score += 70;
    }

    // 3. Thai meaning match
    const thaiMatches = (item.meanings_th || []).some(m => m.toLowerCase().includes(q));
    if (thaiMatches) {
      score += 80;
    }

    // 4. English meaning match
    const enMatches = (item.meanings_en || []).some(m => m.toLowerCase() === q);
    const enSubMatches = (item.meanings_en || []).some(m => m.toLowerCase().includes(q));
    if (enMatches) {
      score += 85;
    } else if (enSubMatches) {
      score += 65;
    }

    // 5. Example compounds match
    if (item.examples && item.examples.some(ex => ex.word.includes(q) || (ex.reading && ex.reading.includes(qKata)) || (ex.meaning_th && ex.meaning_th.includes(q)))) {
      score += 40;
    }

    if (score > 0) {
      scoredResults.push({ item, score });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit).map(res => res.item);
}

/**
 * Get a single kanji by its character.
 * @param {string} char
 * @returns {Promise<object|null>}
 */
export async function getKanji(char) {
  const data = await loadKanjiData();
  return data.find(item => item.kanji === char) || null;
}

/**
 * Get a single kanji by Unicode codepoint hex string.
 * @param {string} hex
 * @returns {Promise<object|null>}
 */
export async function getKanjiByCodepoint(hex) {
  const data = await loadKanjiData();
  const normalized = (hex || '').toUpperCase().replace(/^U\+/, '');
  return data.find(item => (item.codepoint || '').toUpperCase() === normalized) || null;
}

const KANKEN_ORDER = {
  '10': 1, '9': 2, '8': 3, '7': 4, '6': 5, '5': 6,
  '4': 7, '3': 8, 'jun2': 9, '2': 10, 'jun1': 11, '1': 12
};

/**
 * Filter the dataset based on multiple criteria.
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function filterKanji(filters = {}) {
  const data = await loadKanjiData();

  return data.filter(item => {
    // 1. Text Query Filter (Kanji, Kana, Romaji, English, Thai, Compounds, Joyo & Hyougai)
    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      const qKana = romajiToHiragana(q);
      const qKata = toKatakana(qKana);

      const allOn = [...(item.onyomi || []), ...(item.onyomi_hyougai || [])];
      const allKun = [...(item.kunyomi || []), ...(item.kunyomi_hyougai || [])];

      const matchKanji = item.kanji.includes(q);
      const matchOnyomi = allOn.some(o => o.includes(qKata));
      const matchKunyomi = allKun.some(k => toKatakana(k.replace(/\./g, '')).includes(qKata));
      const matchTh = (item.meanings_th || []).some(m => m.toLowerCase().includes(q));
      const matchEn = (item.meanings_en || []).some(m => m.toLowerCase().includes(q));
      const matchEx = (item.examples || []).some(ex => ex.word.includes(q) || (ex.reading && ex.reading.includes(qKata)) || (ex.meaning_th && ex.meaning_th.includes(q)));

      if (!matchKanji && !matchOnyomi && !matchKunyomi && !matchTh && !matchEn && !matchEx) {
        return false;
      }
    }

    // 2. JLPT level filter (e.g. [5, 4, 3, 2, 1])
    if (filters.jlpt && filters.jlpt.length > 0) {
      if (!filters.jlpt.includes(item.jlpt)) return false;
    }

    // 3. School Grade filter (1-6: Elementary, 8: Secondary/High School, 'nonjoyo' / 0: Outside Joyo)
    if (filters.grade && filters.grade.length > 0) {
      const hasElementary = filters.grade.some(g => typeof g === 'number' && g >= 1 && g <= 6 && item.grade === g);
      const hasSecondary = (filters.grade.includes(8) || filters.grade.includes('secondary')) && (item.grade === 8 || (!item.grade && item.joyo));
      const hasNonJoyo = (filters.grade.includes(0) || filters.grade.includes('nonjoyo')) && !item.joyo;

      if (!hasElementary && !hasSecondary && !hasNonJoyo) {
        return false;
      }
    }

    // 4. Kanken level filter (e.g. ['10', '9', 'jun1', '1'])
    if (filters.kanken && filters.kanken.length > 0) {
      if (!filters.kanken.includes(String(item.kanken))) return false;
    }

    // 5. Joyo only filter
    if (filters.joyoOnly && !item.joyo) {
      return false;
    }

    // 6. Non-Joyo only filter
    if (filters.nonJoyoOnly && item.joyo) {
      return false;
    }

    // 7. Radical filter (1-214)
    if (filters.radical) {
      if (Number(item.radical) !== Number(filters.radical)) return false;
    }

    // 8. Stroke count range
    if (filters.strokeMin && item.strokes < filters.strokeMin) return false;
    if (filters.strokeMax && item.strokes > filters.strokeMax) return false;

    // 9. Exact stroke count
    if (filters.strokes && item.strokes !== filters.strokes) return false;

    return true;
  });
}

/**
 * Sort an array of kanji entries with hierarchical tie-breakers.
 * @param {Array} list
 * @param {string} sortBy - 'reading', 'strokes', 'radical', 'grade', 'kanken', 'jlpt', 'unicode'
 * @param {string} order - 'asc' | 'desc'
 */
export function sortKanji(list, sortBy = 'reading', order = 'asc') {
  const sorted = [...list];

  sorted.sort((a, b) => {
    let diff = 0;

    if (sortBy === 'reading') {
      const readA = (a.onyomi && a.onyomi[0]) || (a.kunyomi && a.kunyomi[0]) || '';
      const readB = (b.onyomi && b.onyomi[0]) || (b.kunyomi && b.kunyomi[0]) || '';
      const cleanA = toKatakana(readA.replace(/[\.（）]/g, ''));
      const cleanB = toKatakana(readB.replace(/[\.（）]/g, ''));
      diff = cleanA.localeCompare(cleanB, 'ja');
    } else if (sortBy === 'radical') {
      const radA = a.radical || 999;
      const radB = b.radical || 999;
      diff = radA - radB;
    } else if (sortBy === 'strokes') {
      diff = (a.strokes || 0) - (b.strokes || 0);
    } else if (sortBy === 'kanken') {
      const rankA = KANKEN_ORDER[String(a.kanken)] ?? 99;
      const rankB = KANKEN_ORDER[String(b.kanken)] ?? 99;
      diff = rankA - rankB;
    } else if (sortBy === 'jlpt') {
      const jlptA = a.jlpt ?? 99;
      const jlptB = b.jlpt ?? 99;
      diff = jlptA - jlptB;
    } else if (sortBy === 'grade') {
      const gradeA = a.grade ?? (a.joyo ? 8 : (KANKEN_ORDER[String(a.kanken)] ? KANKEN_ORDER[String(a.kanken)] + 10 : 99));
      const gradeB = b.grade ?? (b.joyo ? 8 : (KANKEN_ORDER[String(b.kanken)] ? KANKEN_ORDER[String(b.kanken)] + 10 : 99));
      diff = gradeA - gradeB;
    } else {
      let valA = a[sortBy] ?? 999;
      let valB = b[sortBy] ?? 999;
      diff = valA > valB ? 1 : (valA < valB ? -1 : 0);
    }

    // Secondary tie-breaker: Stroke count
    if (diff === 0) {
      diff = (a.strokes || 0) - (b.strokes || 0);
    }

    // Tertiary tie-breaker: Unicode codepoint
    if (diff === 0) {
      diff = (a.codepoint || '').localeCompare(b.codepoint || '');
    }

    return order === 'desc' ? -diff : diff;
  });

  return sorted;
}

/**
 * Get the deterministic Kanji of the Day based on the current date.
 * @returns {Promise<object>}
 */
export async function getDailyKanji() {
  const data = await loadKanjiData();
  if (!data.length) return null;

  // Use date hash for consistent kanji throughout the day
  const today = new Date();
  const dateNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = dateNum % data.length;

  return data[index];
}
