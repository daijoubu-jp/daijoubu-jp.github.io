/**
 * kanji-wordle.js
 * ---------------
 * DOM controller for Kanji Wordle. Deduction rules live in
 * kanji-wordle-core.js; this file wires them to the page.
 */

import { COLUMNS, feedback, isWin, dailyTarget, ALL_JOYO_BAND, formatWordleShare } from './kanji-wordle-core.js';
import { BANDS, filterPool } from './time-attack-core.js';
import { loadSearchIndex, searchKanjiIndex } from '../search.js';
import { getWordleStats, saveWordleResult, getGameResult, saveGameResult, copyToClipboard } from '../storage.js';

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
  const targetLink = document.getElementById('kwl-target-link');
  const dictBtn = document.getElementById('kwl-dict-btn');
  const shareBtn = document.getElementById('kwl-share');

  let index = [];
  try {
    index = await loadSearchIndex();
  } catch {
    index = [];
  }

  const allJoyoPool = index.filter(ALL_JOYO_BAND.match);
  const bands = [
    ...(allJoyoPool.length >= 4 ? [{ ...ALL_JOYO_BAND, pool: allJoyoPool }] : []),
    ...BANDS
      .map((band) => ({ ...band, pool: filterPool(index, band.id) }))
      .filter((band) => band.pool.length >= 4),
  ];

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
    }[cell.state] || '';
    const arrow = cell.state === 'higher' ? '<span class="kwl-arrow">▲</span>'
      : cell.state === 'lower' ? '<span class="kwl-arrow">▼</span>' : '';
    const extraClass = cell.id === 'kanji' ? ' kwl-cell-kanji' : '';
    return `<div class="kwl-cell ${stateClass}${extraClass}">${cell.display}${arrow}</div>`;
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

  function updateTargetBridge(targetKanji) {
    if (!targetKanji) return;
    const dictUrl = `../browse/kanji.html?k=${encodeURIComponent(targetKanji)}`;
    targetEl.textContent = targetKanji;
    if (targetLink) targetLink.href = dictUrl;
    if (dictBtn) dictBtn.href = dictUrl;
  }

  function finish(won) {
    state.locked = true;
    state.won = won;
    const guesses = state.guesses.length;

    if (state.mode === 'daily') {
      const stats = saveWordleResult({ date: todayString(), won, guesses });
      resultSub.textContent = `🔥 สตรีค ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
      againBtn.hidden = true;
      try {
        const shareText = formatWordleShare({
          date: todayString(),
          won,
          guesses: state.guesses,
          target: state.target,
          streak: stats.currentStreak,
          maxGuesses: DAILY_MAX,
          mode: 'daily',
        });
        localStorage.setItem('kanji-wordle-last-share', JSON.stringify({
          date: todayString(),
          text: shareText,
          guesses: state.guesses,
        }));
      } catch {}
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
    updateTargetBridge(state.target.kanji);
    showScreen('result');
  }

  function startDaily() {
    if (dailyPool.length === 0) return;
    const target = dailyTarget(dailyPool);
    const stats = getWordleStats();

    if (stats.lastDate === todayString()) {
      let savedGuesses = [];
      try {
        const cached = JSON.parse(localStorage.getItem('kanji-wordle-last-share') || '{}');
        if (cached.date === todayString() && Array.isArray(cached.guesses)) {
          savedGuesses = cached.guesses;
        }
      } catch {}
      state = {
        mode: 'daily',
        bandId: 'daily',
        target,
        guesses: savedGuesses,
        guessed: new Set(savedGuesses.map((g) => g.kanji)),
        locked: true,
        won: Boolean(stats.lastResult?.won),
      };
      resultIcon.textContent = stats.lastResult?.won ? '🎉' : '😵';
      resultTitle.textContent = 'เล่นวันนี้แล้ว';
      resultSub.textContent = `🔥 สตรีค ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
      updateTargetBridge(target.kanji);
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

  function showShareFeedback(message, isError = false) {
    if (shareBtn) {
      const origHtml = shareBtn.innerHTML;
      shareBtn.innerHTML = isError
        ? '<i class="fa-solid fa-triangle-exclamation"></i> ไม่สามารถคัดลอกได้'
        : '<i class="fa-solid fa-check"></i> คัดลอกแล้ว!';
      if (!isError) shareBtn.classList.add('is-success');
      setTimeout(() => {
        shareBtn.innerHTML = origHtml;
        shareBtn.classList.remove('is-success');
      }, 2000);
    }

    const toast = document.getElementById('toast');
    if (toast) {
      const msgEl = document.getElementById('toast-message');
      const iconEl = document.getElementById('toast-icon');
      if (msgEl) msgEl.textContent = message;
      if (iconEl) iconEl.textContent = isError ? '⚠️' : '✓';
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }
  }

  shareBtn?.addEventListener('click', async () => {
    if (!state) return;
    const stats = getWordleStats();
    let shareText = '';

    if (state.guesses && state.guesses.length > 0) {
      const won = typeof state.won === 'boolean'
        ? state.won
        : isWin(state.guesses[state.guesses.length - 1], state.target);
      shareText = formatWordleShare({
        date: todayString(),
        won,
        guesses: state.guesses,
        target: state.target,
        streak: stats.currentStreak,
        maxGuesses: DAILY_MAX,
        mode: state.mode,
      });
    } else if (state.mode === 'daily') {
      try {
        const cached = JSON.parse(localStorage.getItem('kanji-wordle-last-share') || '{}');
        if (cached.date === todayString() && cached.text) {
          shareText = cached.text;
        }
      } catch {}
      if (!shareText) {
        shareText = formatWordleShare({
          date: todayString(),
          won: Boolean(stats.lastResult?.won),
          guesses: [],
          guessCount: stats.lastResult?.guesses,
          target: state.target,
          streak: stats.currentStreak,
          maxGuesses: DAILY_MAX,
          mode: 'daily',
        });
      }
    } else if (state.mode === 'practice') {
      shareText = formatWordleShare({
        date: todayString(),
        won: false,
        guesses: [],
        target: state.target,
        mode: 'practice',
      });
    }

    if (!shareText) return;

    const ok = await copyToClipboard(shareText);
    if (ok) {
      showShareFeedback('คัดลอกผลลัพธ์ไปยังคลิปบอร์ดแล้ว!');
    } else {
      showShareFeedback('ไม่สามารถคัดลอกได้', true);
    }
  });

  giveUpBtn?.addEventListener('click', () => {
    if (state && state.mode === 'practice') finish(false);
  });

  renderBands();
  renderStreak();
  showScreen('start');
}