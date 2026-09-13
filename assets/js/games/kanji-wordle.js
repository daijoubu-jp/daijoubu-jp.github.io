/**
 * kanji-wordle.js
 * ---------------
 * DOM controller for Kanji Wordle. Deduction rules live in
 * kanji-wordle-core.js; this file wires them to the page.
 */

import { COLUMNS, feedback, isWin, dailyTarget } from './kanji-wordle-core.js';
import { BANDS, filterPool } from './time-attack-core.js';
import { loadSearchIndex, searchKanjiIndex } from '../search.js';
import { getWordleStats, saveWordleResult, getGameResult, saveGameResult } from '../storage.js';

const DAILY_MAX = 6;
const PRACTICE_GAME_ID = 'kanji-wordle-practice';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function initKanjiWordle() {
  const startScreen = document.getElementById('kwl-start');
  const gameScreen = document.getElementById('kwl-game');
  const resultScreen = document.getElementById('kwl-result');
  if (!startScreen || !gameScreen || !resultScreen) return;

  const bandsEl = document.getElementById('kwl-bands');
  const input = document.getElementById('kwl-guess-input');
  const suggestionsEl = document.getElementById('kwl-suggestions');
  const gridEl = document.getElementById('kwl-grid');
  const messageEl = document.getElementById('kwl-message');
  const attemptsEl = document.getElementById('kwl-attempts');
  const modeEl = document.getElementById('kwl-mode');
  const streakEl = document.getElementById('kwl-streak');
  const giveUpBtn = document.getElementById('kwl-giveup');
  const againBtn = document.getElementById('kwl-again');
  const resultIcon = document.getElementById('kwl-result-icon');
  const resultTitle = document.getElementById('kwl-result-title');
  const resultSub = document.getElementById('kwl-result-sub');
  const targetEl = document.getElementById('kwl-target');

  let index = [];
  try {
    index = await loadSearchIndex();
  } catch {
    index = [];
  }

  const bands = BANDS
    .map((band) => ({ ...band, pool: filterPool(index, band.id) }))
    .filter((band) => band.pool.length >= 4);

  const dailyPool = index.filter((entry) => entry.joyo);
  let state = null;
  let debounce = null;

  function showScreen(name) {
    startScreen.hidden = name !== 'start';
    gameScreen.hidden = name !== 'game';
    resultScreen.hidden = name !== 'result';
  }

  function renderStreak() {
    const stats = getWordleStats();
    if (stats.played === 0) {
      streakEl.textContent = '';
      return;
    }
    streakEl.textContent = `🔥 สตรีค ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
  }

  function renderBands() {
    bandsEl.innerHTML = bands.map((band) => `
      <button type="button" class="band-chip" data-band="${band.id}">
        <span class="band-chip-label">${band.label}</span>
        <span class="band-chip-count">${band.pool.length} ตัว</span>
      </button>
    `).join('');

    bandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => startPractice(btn.dataset.band));
    });
  }

  function cellHtml(cell) {
    const stateClass = {
      correct: 'is-correct',
      wrong: 'is-wrong',
      higher: 'is-higher',
      lower: 'is-lower',
    }[cell.state];
    const arrow = cell.state === 'higher' ? '<span class="kwl-arrow">▲</span>'
      : cell.state === 'lower' ? '<span class="kwl-arrow">▼</span>' : '';
    return `<div class="kwl-cell ${stateClass}">${cell.display}${arrow}</div>`;
  }

  function renderGrid() {
    const head = `<div class="kwl-row kwl-head">${COLUMNS.map((c) => `<div class="kwl-cell">${c.label}</div>`).join('')}</div>`;
    const rows = state.guesses.map((guess) => {
      const cells = feedback(guess, state.target).map(cellHtml).join('');
      return `<div class="kwl-row">${cells}</div>`;
    }).join('');
    gridEl.innerHTML = head + rows;
  }

  function updateAttempts() {
    if (state.mode === 'daily') {
      attemptsEl.textContent = `${state.guesses.length}/${DAILY_MAX}`;
    } else {
      attemptsEl.textContent = String(state.guesses.length);
    }
  }

  function submitGuess(entry) {
    if (!state || state.locked) return;
    if (state.guessed.has(entry.kanji)) return;

    state.guesses.push(entry);
    state.guessed.add(entry.kanji);
    input.value = '';
    suggestionsEl.classList.remove('show');
    renderGrid();
    updateAttempts();

    if (isWin(entry, state.target)) {
      finish(true);
      return;
    }
    if (state.mode === 'daily' && state.guesses.length >= DAILY_MAX) {
      finish(false);
    }
  }

  function finish(won) {
    state.locked = true;
    const guesses = state.guesses.length;

    if (state.mode === 'daily') {
      const stats = saveWordleResult({ date: todayString(), won, guesses });
      resultSub.textContent = `🔥 สตรีค ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
      againBtn.hidden = true;
    } else {
      let bestText = '';
      if (won) {
        const result = saveGameResult(PRACTICE_GAME_ID, state.bandId, 100 - guesses);
        bestText = `🏆 น้อยสุด: ${100 - result.best} ครั้ง`;
      } else {
        const result = getGameResult(PRACTICE_GAME_ID, state.bandId);
        if (result.best) bestText = `🏆 น้อยสุด: ${100 - result.best} ครั้ง`;
      }
      resultSub.textContent = bestText;
      againBtn.hidden = false;
    }

    resultIcon.textContent = won ? '🎉' : '😵';
    resultTitle.textContent = won ? `ชนะใน ${guesses} ครั้ง!` : 'หมดโอกาส!';
    targetEl.textContent = state.target.kanji;
    showScreen('result');
  }

  function startDaily() {
    if (dailyPool.length === 0) return;
    const target = dailyTarget(dailyPool);
    const stats = getWordleStats();

    if (stats.lastDate === todayString()) {
      state = { mode: 'daily', target, guesses: [], guessed: new Set(), locked: true };
      resultIcon.textContent = stats.lastResult?.won ? '🎉' : '😵';
      resultTitle.textContent = 'เล่นวันนี้แล้ว';
      resultSub.textContent = `🔥 สตรีค ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
      targetEl.textContent = target.kanji;
      againBtn.hidden = true;
      showScreen('result');
      return;
    }

    state = { mode: 'daily', bandId: 'daily', target, guesses: [], guessed: new Set(), locked: false };
    modeEl.textContent = 'รายวัน';
    giveUpBtn.hidden = true;
    beginGame();
  }

  function startPractice(bandId) {
    const band = bands.find((b) => b.id === bandId);
    if (!band || band.pool.length === 0) return;
    const target = band.pool[Math.floor(Math.random() * band.pool.length)];
    state = { mode: 'practice', bandId, target, guesses: [], guessed: new Set(), locked: false };
    modeEl.textContent = band.label;
    giveUpBtn.hidden = false;
    beginGame();
  }

  function beginGame() {
    messageEl.textContent = '';
    gridEl.innerHTML = '';
    input.value = '';
    suggestionsEl.classList.remove('show');
    renderGrid();
    updateAttempts();
    showScreen('game');
    input.focus();
  }

  function renderSuggestions(results) {
    const items = results.filter((entry) => !state.guessed.has(entry.kanji)).slice(0, 8);
    if (items.length === 0) {
      suggestionsEl.classList.remove('show');
      suggestionsEl.innerHTML = '';
      return;
    }

    suggestionsEl.innerHTML = items.map((entry) => {
      const meaning = (entry.meanings_th && entry.meanings_th[0])
        || (entry.meanings_en && entry.meanings_en[0]) || '';
      return `<button type="button" class="autocomplete-item" data-kanji="${entry.kanji}">
        <span class="autocomplete-kanji">${entry.kanji}</span>
        <div class="autocomplete-details">
          <div class="autocomplete-meaning">${meaning}</div>
          <div class="autocomplete-readings">${[...(entry.onyomi || []), ...(entry.kunyomi || [])].slice(0, 3).join(', ')}</div>
        </div>
      </button>`;
    }).join('');
    suggestionsEl.classList.add('show');

    suggestionsEl.querySelectorAll('.autocomplete-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entry = index.find((e) => e.kanji === btn.dataset.kanji);
        if (entry) submitGuess(entry);
      });
    });
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (!query || !state) {
      suggestionsEl.classList.remove('show');
      return;
    }
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      renderSuggestions(searchKanjiIndex(index, query, { limit: 12 }));
    }, 120);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = suggestionsEl.querySelector('.autocomplete-item');
    if (first) {
      const entry = index.find((e) => e.kanji === first.dataset.kanji);
      if (entry) submitGuess(entry);
    }
  });

  document.addEventListener('click', (event) => {
    if (!suggestionsEl.contains(event.target) && event.target !== input) {
      suggestionsEl.classList.remove('show');
    }
  });

  document.getElementById('kwl-daily')?.addEventListener('click', startDaily);

  document.getElementById('kwl-change-mode')?.addEventListener('click', () => {
    state = null;
    showScreen('start');
    renderStreak();
  });

  document.getElementById('kwl-result-mode')?.addEventListener('click', () => {
    state = null;
    showScreen('start');
    renderStreak();
  });

  document.getElementById('kwl-again')?.addEventListener('click', () => {
    if (state && state.mode === 'practice') startPractice(state.bandId);
  });

  giveUpBtn?.addEventListener('click', () => {
    if (state && state.mode === 'practice') finish(false);
  });

  renderBands();
  renderStreak();
  showScreen('start');
}