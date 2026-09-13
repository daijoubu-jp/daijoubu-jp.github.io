/**
 * kanji-wordle.js
 * ---------------
 * DOM controller for Kanji Wordle.
 * Supports Daily (Standard N5–N1 & Advanced Joyo) and
 * Practice (Standard N5–N1 & Advanced Joyo) modes.
 */

import {
  COLUMNS,
  feedback,
  isWin,
  dailyTarget,
  ALL_JOYO_BAND,
  formatWordleShare,
} from './kanji-wordle-core.js';
import { loadSearchIndex, searchKanjiIndex } from '../search.js';
import {
  getWordleStats,
  saveWordleResult,
  getGameResult,
  saveGameResult,
  copyToClipboard,
} from '../storage.js';
import { initSoundToggle, playCorrect, playWrong, playWin } from './audio.js';

const DAILY_MAX = 6;
const PRACTICE_GAME_ID = 'kanji-wordle-practice';

const JLPT_LEVELS = [
  { id: 5, label: 'N5' },
  { id: 4, label: 'N4' },
  { id: 3, label: 'N3' },
  { id: 2, label: 'N2' },
  { id: 1, label: 'N1' },
];

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function initKanjiWordle() {
  const startScreen = document.getElementById('kwl-start');
  const gameScreen = document.getElementById('kwl-game');
  const resultScreen = document.getElementById('kwl-result');
  if (!startScreen || !gameScreen || !resultScreen) return;

  initSoundToggle();

  // Mode Tab Elements
  const tabDaily = document.getElementById('kwl-tab-daily');
  const tabPractice = document.getElementById('kwl-tab-practice');
  const panelDaily = document.getElementById('kwl-panel-daily');
  const panelPractice = document.getElementById('kwl-panel-practice');

  const dailyAdvBtn = document.getElementById('kwl-daily-adv-btn');
  const dailyBandsEl = document.getElementById('kwl-daily-bands');
  const practiceAdvBtn = document.getElementById('kwl-practice-adv-btn');
  const practiceBandsEl = document.getElementById('kwl-practice-bands');

  // Game UI Elements
  const input = document.getElementById('kwl-guess-input');
  const suggestionsEl = document.getElementById('kwl-suggestions');
  const gridEl = document.getElementById('kwl-grid');
  const messageEl = document.getElementById('kwl-message');
  const attemptsEl = document.getElementById('kwl-attempts');
  const modeEl = document.getElementById('kwl-mode');
  const streakEl = document.getElementById('kwl-streak');
  const practiceBestEl = document.getElementById('kwl-practice-best');
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

  const joyoPool = index.filter(ALL_JOYO_BAND.match);

  let state = null;
  let debounce = null;
  let activeTab = 'daily';

  function showScreen(name) {
    startScreen.hidden = name !== 'start';
    gameScreen.hidden = name !== 'game';
    resultScreen.hidden = name !== 'result';
  }

  function setTab(tab) {
    activeTab = tab;
    tabDaily.classList.toggle('is-active', tab === 'daily');
    tabDaily.setAttribute('aria-selected', String(tab === 'daily'));
    tabPractice.classList.toggle('is-active', tab === 'practice');
    tabPractice.setAttribute('aria-selected', String(tab === 'practice'));

    panelDaily.hidden = tab !== 'daily';
    panelPractice.hidden = tab !== 'practice';

    if (tab === 'daily') {
      renderDailyStats();
    } else {
      renderPracticeStats();
    }
  }

  function renderDailyStats() {
    const stats = getWordleStats('adv');
    if (stats.played === 0) {
      streakEl.textContent = 'เลือกโหมดประจำวันเพื่อเริ่มเล่น';
      return;
    }
    streakEl.textContent = `🔥 สตรีคขั้นสูง: ${stats.currentStreak} วัน · สูงสุด ${stats.maxStreak} · ชนะ ${stats.won}/${stats.played}`;
  }

  function renderPracticeStats() {
    const res = getGameResult(PRACTICE_GAME_ID, 'practice-adv');
    if (res && res.best) {
      practiceBestEl.textContent = `🏆 สถิติดีที่สุดขั้นสูง: ${100 - res.best} ครั้ง`;
    } else {
      practiceBestEl.textContent = 'เลือกโหมดฝึกซ้อมเพื่อเริ่มฝึกทายได้ไม่จำกัด';
    }
  }

  function renderModeButtons() {
    // Daily JLPT Chips
    dailyBandsEl.innerHTML = JLPT_LEVELS.map((lvl) => {
      const count = joyoPool.filter((k) => Number(k.jlpt) === lvl.id).length;
      return `
        <button type="button" class="band-chip" data-jlpt="${lvl.id}">
          <span class="band-chip-label">${lvl.label}</span>
          <span class="band-chip-count">${count} ตัว</span>
        </button>
      `;
    }).join('');

    dailyBandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jlpt = Number(btn.dataset.jlpt);
        startDailyStandard(jlpt);
      });
    });

    // Practice JLPT Chips
    practiceBandsEl.innerHTML = JLPT_LEVELS.map((lvl) => {
      const count = joyoPool.filter((k) => Number(k.jlpt) === lvl.id).length;
      return `
        <button type="button" class="band-chip" data-jlpt="${lvl.id}">
          <span class="band-chip-label">${lvl.label}</span>
          <span class="band-chip-count">${count} ตัว</span>
        </button>
      `;
    }).join('');

    practiceBandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jlpt = Number(btn.dataset.jlpt);
        startPracticeStandard(jlpt);
      });
    });
  }

  function cellHtml(cell) {
    const stateClass = {
      correct: 'is-correct',
      wrong: 'is-wrong',
      higher: 'is-higher',
      lower: 'is-lower',
      near: 'is-near',
    }[cell.state] || '';

    const arrow = cell.state === 'higher' ? '<span class="kwl-arrow">▲</span>'
      : cell.state === 'lower' ? '<span class="kwl-arrow">▼</span>' : '';
    const extraClass = cell.id === 'kanji' ? ' kwl-cell-kanji' : '';
    return `<div class="kwl-cell ${stateClass}${extraClass}">${cell.display}${arrow}</div>`;
  }

  function renderGrid(isNewGuess = false) {
    const head = `<div class="kwl-row kwl-head">${COLUMNS.map((c) => `<div class="kwl-cell">${c.label}</div>`).join('')}</div>`;
    const rows = state.guesses.map((guess, index) => {
      const isLast = index === state.guesses.length - 1;
      const rowClass = isLast && isNewGuess ? 'kwl-row is-new-guess' : 'kwl-row';
      const cells = feedback(guess, state.target).map(cellHtml).join('');
      return `<div class="${rowClass}">${cells}</div>`;
    }).join('');
    gridEl.innerHTML = head + rows;
  }

  function updateAttempts() {
    if (state.mode.startsWith('daily')) {
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
    renderGrid(true);
    updateAttempts();

    if (isWin(entry, state.target)) {
      playWin();
      finish(true);
      return;
    }
    if (state.mode.startsWith('daily') && state.guesses.length >= DAILY_MAX) {
      playWrong();
      finish(false);
      return;
    }

    const cells = feedback(entry, state.target);
    const hasMatch = cells.some((c) => c.id !== 'kanji' && c.state === 'correct');
    if (hasMatch) {
      playCorrect();
    } else {
      playWrong();
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

    if (state.mode.startsWith('daily')) {
      const stats = saveWordleResult({
        date: todayString(),
        won,
        guesses,
        modeKey: state.modeKey,
      });
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
          mode: state.mode,
          jlpt: state.jlpt,
        });
        localStorage.setItem(`kanji-wordle-last-share-${state.modeKey}`, JSON.stringify({
          date: todayString(),
          text: shareText,
          guesses: state.guesses,
        }));
      } catch {}
    } else {
      let bestText = '';
      if (won) {
        const result = saveGameResult(PRACTICE_GAME_ID, state.modeKey, 100 - guesses);
        bestText = `🏆 สถิติดีที่สุด: ${100 - result.best} ครั้ง`;
      } else {
        const result = getGameResult(PRACTICE_GAME_ID, state.modeKey);
        if (result && result.best) bestText = `🏆 สถิติดีที่สุด: ${100 - result.best} ครั้ง`;
      }
      resultSub.textContent = bestText;
      againBtn.hidden = false;
    }

    resultIcon.textContent = won ? '🎉' : '😵';
    resultTitle.textContent = won ? `ชนะใน ${guesses} ครั้ง!` : 'หมดโอกาส!';
    updateTargetBridge(state.target.kanji);
    showScreen('result');
  }

  function startDailyAdvanced() {
    if (joyoPool.length === 0) return;
    const modeKey = 'adv';
    const target = dailyTarget(joyoPool, new Date());
    initDailySession('daily-advanced', modeKey, 'รายวัน (Advanced)', target, null);
  }

  function startDailyStandard(jlpt) {
    const pool = joyoPool.filter((k) => Number(k.jlpt) === jlpt);
    if (pool.length === 0) return;
    const modeKey = `std-n${jlpt}`;
    const target = dailyTarget(pool, new Date(), { jlpt });
    initDailySession('daily-standard', modeKey, `รายวัน (N${jlpt})`, target, jlpt);
  }

  function initDailySession(mode, modeKey, displayMode, target, jlpt) {
    const stats = getWordleStats(modeKey);

    if (stats.lastDate === todayString()) {
      let savedGuesses = [];
      try {
        const cached = JSON.parse(
          localStorage.getItem(`kanji-wordle-last-share-${modeKey}`) || '{}'
        );
        if (cached.date === todayString() && Array.isArray(cached.guesses)) {
          savedGuesses = cached.guesses;
        }
      } catch {}

      state = {
        mode,
        modeKey,
        jlpt,
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

    state = {
      mode,
      modeKey,
      jlpt,
      target,
      guesses: [],
      guessed: new Set(),
      locked: false,
    };
    modeEl.textContent = displayMode;
    giveUpBtn.hidden = true;
    beginGame();
  }

  function startPracticeAdvanced() {
    if (joyoPool.length === 0) return;
    const target = joyoPool[Math.floor(Math.random() * joyoPool.length)];
    state = {
      mode: 'practice-advanced',
      modeKey: 'practice-adv',
      jlpt: null,
      target,
      guesses: [],
      guessed: new Set(),
      locked: false,
    };
    modeEl.textContent = 'ฝึกซ้อม (Advanced)';
    giveUpBtn.hidden = false;
    beginGame();
  }

  function startPracticeStandard(jlpt) {
    const pool = joyoPool.filter((k) => Number(k.jlpt) === jlpt);
    if (pool.length === 0) return;
    const target = pool[Math.floor(Math.random() * pool.length)];
    state = {
      mode: 'practice-standard',
      modeKey: `practice-std-n${jlpt}`,
      jlpt,
      target,
      guesses: [],
      guessed: new Set(),
      locked: false,
    };
    modeEl.textContent = `ฝึกซ้อม (N${jlpt})`;
    giveUpBtn.hidden = false;
    beginGame();
  }

  function beginGame() {
    messageEl.textContent = '';
    gridEl.innerHTML = '';
    input.value = '';
    suggestionsEl.classList.remove('show');
    renderGrid(false);
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

  // Tab Listeners
  tabDaily?.addEventListener('click', () => setTab('daily'));
  tabPractice?.addEventListener('click', () => setTab('practice'));

  // Action Buttons
  dailyAdvBtn?.addEventListener('click', startDailyAdvanced);
  practiceAdvBtn?.addEventListener('click', startPracticeAdvanced);

  document.getElementById('kwl-change-mode')?.addEventListener('click', () => {
    state = null;
    showScreen('start');
    if (activeTab === 'daily') renderDailyStats();
    else renderPracticeStats();
  });

  document.getElementById('kwl-result-mode')?.addEventListener('click', () => {
    state = null;
    showScreen('start');
    if (activeTab === 'daily') renderDailyStats();
    else renderPracticeStats();
  });

  againBtn?.addEventListener('click', () => {
    if (!state) return;
    if (state.mode === 'practice-advanced') {
      startPracticeAdvanced();
    } else if (state.mode === 'practice-standard') {
      startPracticeStandard(state.jlpt);
    }
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
    const stats = getWordleStats(state.modeKey);
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
        jlpt: state.jlpt,
      });
    } else if (state.mode.startsWith('daily')) {
      try {
        const cached = JSON.parse(
          localStorage.getItem(`kanji-wordle-last-share-${state.modeKey}`) || '{}'
        );
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
          mode: state.mode,
          jlpt: state.jlpt,
        });
      }
    } else {
      shareText = formatWordleShare({
        date: todayString(),
        won: false,
        guesses: [],
        target: state.target,
        mode: state.mode,
        jlpt: state.jlpt,
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
    if (state && state.mode.startsWith('practice')) {
      playWrong();
      finish(false);
    }
  });

  renderModeButtons();
  setTab('daily');
  showScreen('start');
}