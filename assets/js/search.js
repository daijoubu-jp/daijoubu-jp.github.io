/**
 * search.js
 * ---------
 * Data fetching, caching, filtering and smart search (Kanji, Kana, Romaji, English, Thai).
 */

/**
 * Wrap an async loader so concurrent callers share one in-flight promise.
 * The cache resets after a rejection, allowing a later call to retry.
 * @param {() => Promise<*>} loader
 * @returns {{ get: () => Promise<*> }}
 */
export function createPromiseCache(loader) {
  let promise = null;

  return {
    get() {
      if (!promise) {
        promise = Promise.resolve()
          .then(loader)
          .catch((err) => {
            promise = null;
            throw err;
          });
      }
      return promise;
    }
  };
}

const kanjiDataCache = createPromiseCache(async () => {
  // 🚀 Load the optimized, minified bundle (1 HTTP request instead of 12)
  const dataUrl = new URL('../../data/kanji.min.json?v=1788410559', import.meta.url).href;
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
});

/**
 * Load the modular kanji datasets concurrently with bundle fallback.
 * @returns {Promise<Array>}
 */
export async function loadKanjiData() {
  try {
    return await kanjiDataCache.get();
  } catch (err) {
    console.error('Fatal: Failed to load kanji.min.json. Did you forget to run scripts/compile_content.py?', err);
    return [];
  }
}

const searchIndexCache = createPromiseCache(async () => {
  const dataUrl = new URL('../../data/search-index.min.json?v=20260911', import.meta.url).href;
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
});

/**
 * Load the slim home-page search index (readings + first meanings only).
 * @returns {Promise<Array>}
 */
export async function loadSearchIndex() {
  try {
    return await searchIndexCache.get();
  } catch (err) {
    console.error('Fatal: Failed to load search-index.min.json. Did you forget to run scripts/compile_content.py?', err);
    return [];
  }
}

const componentsCache = createPromiseCache(async () => {
  const dataUrl = new URL('../../data/kanji-components.min.json?v=20260912', import.meta.url).href;
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
});

/**
 * Load the KRADFILE component decomposition data for the Kanji in Kanji game.
 * @returns {Promise<{ entries: Record<string, string[]>, pool: string[] }>}
 */
export async function loadKanjiComponents() {
  try {
    return await componentsCache.get();
  } catch (err) {
    console.error('Fatal: Failed to load kanji-components.min.json. Did you forget to run scripts/build_components.py?', err);
    return { entries: {}, pool: [] };
  }
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
 * Score one kanji entry against a prepared query. Shared by the full search
 * (searchKanji) and the slim home index (searchKanjiIndex).
 * @param {object} item
 * @param {string} q Lowercased query
 * @param {string} qKana Query converted to hiragana
 * @param {string} qKata Query converted to katakana
 * @returns {number}
 */
function scoreEntry(item, q, qKana, qKata) {
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

  // 3. Jinmei (name readings) match
  const jinmei = (item.jinmei || item.nanori || []).join(' ');
  const jinmeiKata = toKatakana(jinmei);
  if (jinmeiKata === qKata) {
    score += 110;
  } else if (jinmeiKata.includes(qKata)) {
    score += 65;
  }

  // 4. Japanese meaning match (字義)
  const jaMatches = (item.meanings_ja || []).some(m => m === q || m === qKana);
  const jaSubMatches = (item.meanings_ja || []).some(m => m.includes(q) || m.includes(qKana));
  if (jaMatches) {
    score += 85;
  } else if (jaSubMatches) {
    score += 60;
  }

  // 5. Thai meaning match (exact beats substring)
  const thaiExact = (item.meanings_th || []).some(m => m.toLowerCase() === q);
  const thaiSub = (item.meanings_th || []).some(m => m.toLowerCase().includes(q));
  if (thaiExact) {
    score += 95;
  } else if (thaiSub) {
    score += 60;
  }

  // 6. English meaning match
  const enMatches = (item.meanings_en || []).some(m => m.toLowerCase() === q);
  const enSubMatches = (item.meanings_en || []).some(m => m.toLowerCase().includes(q));
  if (enMatches) {
    score += 85;
  } else if (enSubMatches) {
    score += 65;
  }

  // 7. Example compounds match (only present in the full dataset)
  if (item.examples && item.examples.some(ex => ex.word.includes(q) || (ex.reading && ex.reading.includes(qKata)) || (ex.meaning_th && ex.meaning_th.includes(q)))) {
    score += 40;
  }

  return score;
}

/**
 * Rank entries by score and return the top `limit`.
 * @param {Array} data
 * @param {string} query
 * @param {number} limit
 * @returns {Array}
 */
function rankEntries(data, query, limit) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const qKana = romajiToHiragana(q);
  const qKata = toKatakana(qKana);

  const scoredResults = [];
  for (const item of data) {
    const score = scoreEntry(item, q, qKana, qKata);
    if (score > 0) {
      scoredResults.push({ item, score });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit).map(res => res.item);
}

/**
 * Search the dataset with multi-language smart scoring.
 * @param {string} query
 * @param {object} [options] `data` overrides the loaded dataset (tests), `limit` caps results.
 * @returns {Promise<Array>}
 */
export async function searchKanji(query, options = {}) {
  const data = options.data || await loadKanjiData();
  return rankEntries(data, query, options.limit || 50);
}

/**
 * Search the slim home-page index (readings + first meanings per language).
 * @param {Array} index
 * @param {string} query
 * @param {object} [options]
 * @returns {Array}
 */
export function searchKanjiIndex(index, query, options = {}) {
  return rankEntries(index || [], query, options.limit || 50);
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
export async function filterKanji(filters = {}, options = {}) {
  const data = options.data || await loadKanjiData();

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

    // 3. School grade (1-6) or Kanken-derived school stage (mid / high / univ)
    if (filters.grade && filters.grade.length > 0) {
      const stageKanken = { mid: ['4', '3'], high: ['jun2', '2'], univ: ['jun1', '1'] };
      const grades = filters.grade.filter(g => /^[1-6]$/.test(String(g))).map(Number);
      const stages = filters.grade.filter(g => typeof g === 'string' && stageKanken[g]);
      const matchesGrade = grades.includes(item.grade);
      const matchesStage = stages.some(s => stageKanken[s].includes(String(item.kanken)));
      if (!matchesGrade && !matchesStage) return false;
    }

    // 4. Kanken level filter (e.g. ['10', '9', 'jun1', '1'])
    if (filters.kanken && filters.kanken.length > 0) {
      if (!filters.kanken.includes(String(item.kanken))) return false;
    }

    // 5. Kanji scope: only restrict when exactly one box is checked
    const scopeActive = Boolean(filters.joyoOnly) !== Boolean(filters.nonJoyoOnly);
    if (scopeActive) {
      if (filters.joyoOnly && !item.joyo) return false;
      if (filters.nonJoyoOnly && item.joyo) return false;
    }

    // 5b. Name-legal kanji only (人名用漢字)
    if (filters.nameUseOnly && !item.nameUse) return false;

    // 6. Radical filter (1-214)
    if (filters.radical) {
      if (Number(item.radical) !== Number(filters.radical)) return false;
    }

    // 7. Stroke count range
    if (filters.strokeMin && item.strokes < filters.strokeMin) return false;
    if (filters.strokeMax && item.strokes > filters.strokeMax) return false;

    // 8. Exact stroke count
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
 * 32-bit integer string hashing algorithm.
 * @param {string} str
 * @returns {number}
 */
function hashDateString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

/**
 * Mulberry32 32-bit PRNG generator.
 * @param {number} a Seed
 * @returns {() => number} Returns pseudo-random float in [0, 1)
 */
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Get the deterministic Kanji of the Day from a dataset (full data or slim index)
 * using a PRNG seeded by the local date.
 * @param {Array} data
 * @param {Date} [date]
 * @returns {object|null}
 */
export function getDailyKanjiFromIndex(data, date = new Date()) {
  if (!data || !data.length) return null;

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const seed = hashDateString(dateStr);
  const rng = mulberry32(seed);

  const index = Math.floor(rng() * data.length);
  return data[index];
}

