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
 * Returns the saved theme id, or 'spring' if none is stored.
 * @returns {string}
 */
export function getTheme() {
  return localStorage.getItem(KEYS.THEME) || 'spring';
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
 * Returns the saved theme mode ('light' | 'dark'), default 'light'.
 * @returns {'light'|'dark'}
 */
export function getThemeMode() {
  return localStorage.getItem(KEYS.MODE) || 'light';
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
