/**
 * storage.js
 * -----------
 * Centralised localStorage abstraction for the Kanji Dictionary.
 * All reads/writes go through typed helpers so the rest of the app
 * never touches raw localStorage directly.
 *
 * Keys used:
 *   kanji-theme    – active theme id string
 *   kanji-favorites – JSON array of kanji character strings
 *   kanji-recent   – JSON array of recent search term strings (max 10)
 *   kanji-daily    – JSON { date: 'YYYY-MM-DD', kanji: <kanjiObject> }
 *   kanji-settings – JSON user settings object
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYS = Object.freeze({
  THEME:    'kanji-theme',
  MODE:     'kanji-theme-mode',
  FAVS:     'kanji-favorites',
  RECENT:   'kanji-recent',
  DAILY:    'kanji-daily',
  SETTINGS: 'kanji-settings',
  GAMES:    'kanji-games',
  WORDLE:   'kanji-wordle',
});

const MAX_RECENT_SEARCHES = 10;

/** Default user settings; merged with stored value so new keys always exist. */
const DEFAULT_SETTINGS = Object.freeze({
  showThaiMeanings: true,
  showEnMeanings:   true,
  defaultTab:       'all',
});

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Read and JSON-parse a localStorage value.
 * Returns `fallback` if the key is missing or the JSON is invalid.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * JSON-stringify and write a value to localStorage.
 * Silently swallows errors (private browsing / quota exceeded).
 * @param {string} key
 * @param {*} value
 */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing mode or storage quota exceeded – fail silently.
  }
}

// ─── Theme & Mode ─────────────────────────────────────────────────────────────

/**
 * Calculates the default seasonal theme based on current month:
 * - Spring: Apr - June (4, 5, 6)
 * - Summer: July - September (7, 8, 9)
 * - Autumn: October - December (10, 11, 12)
 * - Winter: Jan - March (1, 2, 3)
 * @param {Date} [d]
 * @returns {'spring'|'summer'|'autumn'|'winter'}
 */
export function getSeasonalTheme(d = new Date()) {
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4 && month <= 6) return 'spring';
  if (month >= 7 && month <= 9) return 'summer';
  if (month >= 10 && month <= 12) return 'autumn';
  return 'winter';
}

/**
 * Calculates the default mode based on current time:
 * - Light theme: 06:00:00 - 17:59:59
 * - Dark theme: 18:00:00 - 05:59:59
 * @param {Date} [d]
 * @returns {'light'|'dark'}
 */
export function getTimeBasedMode(d = new Date()) {
  const hour = d.getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

/**
 * Returns the saved theme id, or dynamic seasonal theme if none is stored.
 * @returns {string}
 */
export function getTheme() {
  return localStorage.getItem(KEYS.THEME) || getSeasonalTheme();
}

/**
 * Saves the theme id to localStorage.
 * @param {string} name – theme id (e.g. 'spring', 'summer')
 */
export function setTheme(name) {
  try {
    localStorage.setItem(KEYS.THEME, name);
  } catch {
    // Fail silently
  }
}

/**
 * Returns the saved theme mode ('light' | 'dark'), or time-based mode if none stored.
 * @returns {'light'|'dark'}
 */
export function getThemeMode() {
  return localStorage.getItem(KEYS.MODE) || getTimeBasedMode();
}

/**
 * Saves the theme mode to localStorage.
 * @param {'light'|'dark'} mode
 */
export function setThemeMode(mode) {
  try {
    localStorage.setItem(KEYS.MODE, mode === 'dark' ? 'dark' : 'light');
  } catch {
    // Fail silently
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

/**
 * Returns the array of favourite kanji character strings.
 * @returns {string[]}
 */
export function getFavorites() {
  return readJSON(KEYS.FAVS, []);
}

/**
 * Adds a kanji character to the favourites list (idempotent).
 * @param {string} kanji – single kanji character, e.g. '愛'
 */
export function addFavorite(kanji) {
  const favs = getFavorites();
  if (!favs.includes(kanji)) {
    favs.push(kanji);
    writeJSON(KEYS.FAVS, favs);
  }
}

/**
 * Removes a kanji character from the favourites list.
 * @param {string} kanji
 */
export function removeFavorite(kanji) {
  const favs = getFavorites().filter(k => k !== kanji);
  writeJSON(KEYS.FAVS, favs);
}

/**
 * Returns true if the kanji character is in the favourites list.
 * @param {string} kanji
 * @returns {boolean}
 */
export function isFavorite(kanji) {
  return getFavorites().includes(kanji);
}

// ─── Recent searches ──────────────────────────────────────────────────────────

/**
 * Returns the array of recent search terms (most-recent first, max 10).
 * @returns {string[]}
 */
export function getRecentSearches() {
  return readJSON(KEYS.RECENT, []);
}

/**
 * Prepends `term` to recent searches, deduplicates, caps at MAX_RECENT_SEARCHES.
 * @param {string} term
 */
export function addRecentSearch(term) {
  if (!term || !term.trim()) return;
  const normalized = term.trim();
  // Remove existing entry so it bubbles to top
  const recents = getRecentSearches().filter(t => t !== normalized);
  recents.unshift(normalized);
  writeJSON(KEYS.RECENT, recents.slice(0, MAX_RECENT_SEARCHES));
}

/** Clears all recent searches. */
export function clearRecentSearches() {
  writeJSON(KEYS.RECENT, []);
}

// ─── Daily Kanji ──────────────────────────────────────────────────────────────

/**
 * Returns today's daily kanji object, or null if none is stored for today.
 * Stale entries (wrong date) are treated as missing so the caller can refresh.
 * @returns {{ date: string, kanji: object } | null}
 */
export function getDailyKanji() {
  const stored = readJSON(KEYS.DAILY, null);
  if (!stored) return null;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  if (stored.date !== today) return null;
  return stored;
}

/**
 * Stores today's daily kanji object together with today's date.
 * @param {object} kanji – full kanji data object
 */
export function setDailyKanji(kanji) {
  const today = new Date().toISOString().slice(0, 10);
  writeJSON(KEYS.DAILY, { date: today, kanji });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * Returns the full settings object, merging any missing keys with defaults.
 * @returns {{ showThaiMeanings: boolean, showEnMeanings: boolean, defaultTab: string }}
 */
export function getSettings() {
  const stored = readJSON(KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Merges `partial` into the current settings object and persists it.
 * @param {Partial<typeof DEFAULT_SETTINGS>} partial
 */
export function updateSettings(partial) {
  const current = getSettings();
  writeJSON(KEYS.SETTINGS, { ...current, ...partial });
}

// ─── Game Stats ───────────────────────────────────────────────────────────────

/**
 * Returns all stored game stats: `{ [gameId]: { [bandId]: { best, last } } }`.
 * @returns {object}
 */
export function getGameStats() {
  return readJSON(KEYS.GAMES, {});
}

/**
 * Returns the stored result for one game + band, defaulting to zeros.
 * @param {string} gameId
 * @param {string} bandId
 * @returns {{ best: number, last: number }}
 */
export function getGameResult(gameId, bandId) {
  const stats = getGameStats();
  return stats[gameId]?.[bandId] || { best: 0, last: 0 };
}

/**
 * Persists a run's score, keeping the best and last score per game + band.
 * @param {string} gameId
 * @param {string} bandId
 * @param {number} score
 * @returns {{ best: number, last: number }}
 */
export function saveGameResult(gameId, bandId, score) {
  const stats = getGameStats();
  const current = stats[gameId]?.[bandId] || { best: 0, last: 0 };
  const updated = { best: Math.max(current.best || 0, score), last: score };
  stats[gameId] = { ...(stats[gameId] || {}), [bandId]: updated };
  writeJSON(KEYS.GAMES, stats);
  return updated;
}

// ─── Kanji Wordle Stats ─────────────────────────────────────────────────────

const EMPTY_WORDLE_STATS = Object.freeze({
  currentStreak: 0,
  maxStreak: 0,
  played: 0,
  won: 0,
  distribution: [0, 0, 0, 0, 0, 0],
  lastDate: null,
  lastResult: null,
});

function getWordleStorageKey(modeKey = '') {
  return modeKey ? `${KEYS.WORDLE}-${modeKey}` : KEYS.WORDLE;
}

/**
 * Returns the Kanji Wordle stats, filling in missing keys.
 * @param {string} [modeKey=''] - Optional mode key (e.g. 'advanced', 'n5')
 * @returns {{ currentStreak: number, maxStreak: number, played: number, won: number,
 *            distribution: number[], lastDate: string|null, lastResult: object|null }}
 */
export function getWordleStats(modeKey = '') {
  const key = getWordleStorageKey(modeKey);
  return { ...EMPTY_WORDLE_STATS, ...readJSON(key, {}) };
}

/**
 * Checks whether two YYYY-MM-DD date strings are strictly consecutive calendar days.
 * @param {string|null} prevDateStr
 * @param {string} curDateStr
 * @returns {boolean}
 */
export function isConsecutiveDay(prevDateStr, curDateStr) {
  if (!prevDateStr || !curDateStr) return false;
  const prev = new Date(`${prevDateStr}T00:00:00Z`);
  const cur = new Date(`${curDateStr}T00:00:00Z`);
  if (Number.isNaN(prev.getTime()) || Number.isNaN(cur.getTime())) return false;
  const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
  return diffDays === 1;
}

/**
 * Records one daily result. Idempotent per date: saving twice for the same
 * date leaves the stats unchanged.
 * @param {{ date: string, won: boolean, guesses: number, modeKey?: string }} result
 * @returns {object} the updated stats
 */
export function saveWordleResult({ date, won, guesses, modeKey = '' }) {
  const key = getWordleStorageKey(modeKey);
  const stats = getWordleStats(modeKey);
  if (stats.lastDate === date) return stats;

  stats.played += 1;
  if (won) {
    stats.won += 1;
    if (stats.lastDate && isConsecutiveDay(stats.lastDate, date)) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    if (guesses >= 1 && guesses <= stats.distribution.length) {
      stats.distribution[guesses - 1] += 1;
    }
  } else {
    stats.currentStreak = 0;
  }
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.lastDate = date;
  stats.lastResult = { won, guesses };

  writeJSON(key, stats);
  return stats;
}

// ─── Cross-Browser Clipboard Helper ──────────────────────────────────────────

/**
 * Copies text to the clipboard with robust fallbacks for Safari, iOS, and restricted contexts.
 * @param {string} text Text to copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const successful = document.execCommand('copy');
    ta.remove();
    return successful;
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);
    return false;
  }
}

