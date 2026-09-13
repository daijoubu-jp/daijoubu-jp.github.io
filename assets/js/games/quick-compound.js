/**
 * quick-compound.js
 * -----------------
 * DOM controller for the Quick Compound game. Rules live in
 * quick-compound-core.js; this file wires them to the page.
 */

import { BANDS, filterPool } from './time-attack-core.js';
import { makeRounds, isRoundComplete } from './quick-compound-core.js';
import { loadSearchIndex, loadCompoundsData } from '../search.js';
import { getGameResult, saveGameResult } from '../storage.js';

const GAME_ID = 'quick-compound';
const ROUND_SECONDS = 60;
const ROUND_CHUNK = 400;
const VALID_PER_ROUND = 3;
const DECOY_PER_ROUND = 6;
const WRONG_PENALTY_MS = 2000;
const COMPLETE_DELAY_MS = 500;
const WRONG_DELAY_MS = 450;

export async function initQuickCompound() {
  const startScreen = document.getElementById('qc-start');
  const gameScreen = document.getElementById('qc-game');
  const resultScreen = document.getElementById('qc-result');
  if (!startScreen || !gameScreen || !resultScreen) return;

  const bandsEl = document.getElementById('qc-bands');
  const wordsEl = document.getElementById('qc-words');
  const kanjiEl = document.getElementById('qc-kanji');
  const scoreEl = document.getElementById('qc-score');
  const timeEl = document.getElementById('qc-time');
  const timerFill = document.getElementById('qc-timer-fill');
  const timerEl = document.getElementById('qc-timer');
  const feedbackEl = document.getElementById('qc-feedback');
  const finalEl = document.getElementById('qc-final');
  const bestEl = document.getElementById('qc-best');
  const newBestEl = document.getElementById('qc-newbest');

  let timerId = null;
  let state = null;

  const [index, data] = await Promise.all([loadSearchIndex(), loadCompoundsData()]);

  const bands = BANDS
    .map((band) => ({
      ...band,
      targets: filterPool(index, band.id)
        .map((entry) => entry.kanji)
        .filter((kanji) => (data.byKanji[kanji] || []).length > 0),
    }))
    .filter((band) => band.targets.length >= 4);

  if (bands.length === 0) {
    startScreen.innerHTML = '<p class="game-empty">ไม่สามารถโหลดข้อมูลคำประสมได้ในขณะนี้ กรุณาลองใหม่ภายหลัง</p>';
    return;
  }

  function showScreen(name) {
    startScreen.hidden = name !== 'start';
    gameScreen.hidden = name !== 'game';
    resultScreen.hidden = name !== 'result';
  }

  function renderBands() {
    bandsEl.innerHTML = bands.map((band) => `
      <button type="button" class="band-chip" data-band="${band.id}">
        <span class="band-chip-label">${band.label}</span>
        <span class="band-chip-count">${band.targets.length} ตัว</span>
      </button>
    `).join('');

    bandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => startGame(btn.dataset.band));
    });
  }

  function currentRound() {
    return state.rounds[state.index % state.rounds.length];
  }

  function renderRound() {
    const round = currentRound();
    state.selected = new Set();
    kanjiEl.textContent = round.kanji;
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('is-complete', 'is-wrong');

    wordsEl.innerHTML = round.tiles.map((wordIndex) => {
      const [surface, reading] = data.words[wordIndex];
      return `<button type="button" class="qc-word" data-index="${wordIndex}">
        <span class="qc-word-surface">${surface}</span>
        <span class="qc-word-reading">${reading}</span>
      </button>`;
    }).join('');

    wordsEl.querySelectorAll('.qc-word').forEach((btn) => {
      btn.addEventListener('click', () => selectWord(btn));
    });
  }

  function selectWord(btn) {
    if (!state || state.locked) return;
    const wordIndex = Number(btn.dataset.index);
    const round = currentRound();
    if (state.selected.has(wordIndex)) return;

    const [surface, reading, glossEn, glossTh] = data.words[wordIndex];

    if (round.valid.includes(wordIndex)) {
      state.selected.add(wordIndex);
      btn.classList.add('selected');
      feedbackEl.textContent = `${surface} (${reading}) — ${glossTh || glossEn}`;
      feedbackEl.classList.remove('is-wrong');

      if (isRoundComplete([...state.selected], round.valid)) {
        state.locked = true;
        state.score += 1;
        scoreEl.textContent = String(state.score);
        feedbackEl.textContent = 'ครบแล้ว!';
        feedbackEl.classList.add('is-complete');
        window.setTimeout(nextRound, COMPLETE_DELAY_MS);
      }
      return;
    }

    state.locked = true;
    btn.classList.add('wrong');
    feedbackEl.textContent = `คำนี้ไม่มีคันจิ ${round.kanji}`;
    feedbackEl.classList.add('is-wrong');
    state.endAt -= WRONG_PENALTY_MS;
    window.setTimeout(() => {
      btn.classList.remove('wrong');
      if (!state) return;
      state.locked = false;
    }, WRONG_DELAY_MS);
  }

  function nextRound() {
    if (!state) return;
    state.index += 1;
    state.locked = false;
    renderRound();
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(() => {
      if (!state) return;
      const remaining = Math.max(0, (state.endAt - Date.now()) / 1000);
      timeEl.textContent = String(Math.ceil(remaining));
      timerFill.style.width = `${(remaining / ROUND_SECONDS) * 100}%`;
      timerEl?.setAttribute('aria-valuenow', String(Math.ceil(remaining)));
      if (remaining <= 0) endGame();
    }, 100);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startGame(bandId) {
    const band = bands.find((b) => b.id === bandId);
    if (!band) return;

    state = {
      bandId,
      rounds: makeRounds(band.targets, data, ROUND_CHUNK, VALID_PER_ROUND, DECOY_PER_ROUND),
      index: 0,
      score: 0,
      selected: new Set(),
      locked: false,
      endAt: Date.now() + ROUND_SECONDS * 1000,
    };

    scoreEl.textContent = '0';
    timeEl.textContent = String(ROUND_SECONDS);
    timerFill.style.width = '100%';
    timerEl?.setAttribute('aria-valuenow', String(ROUND_SECONDS));
    newBestEl.hidden = true;

    showScreen('game');
    renderRound();
    startTimer();
  }

  function endGame() {
    stopTimer();
    if (!state) return;

    const previous = getGameResult(GAME_ID, state.bandId);
    const isNewBest = state.score > previous.best;
    const saved = saveGameResult(GAME_ID, state.bandId, state.score);

    finalEl.textContent = String(state.score);
    bestEl.textContent = String(saved.best);
    newBestEl.hidden = !isNewBest;

    const targetWrap = document.getElementById('qc-target-wrap');
    const targetEl = document.getElementById('qc-target');
    const targetLink = document.getElementById('qc-target-link');
    const dictBtn = document.getElementById('qc-dict-btn');

    const currentRound = state.rounds && state.rounds.length > 0
      ? state.rounds[state.index % state.rounds.length]
      : null;
    const target = currentRound?.kanji;
    if (target) {
      const dictUrl = `../browse/kanji.html?k=${encodeURIComponent(target)}`;
      if (targetEl) targetEl.textContent = target;
      if (targetLink) targetLink.href = dictUrl;
      if (dictBtn) {
        dictBtn.href = dictUrl;
        dictBtn.hidden = false;
      }
      if (targetWrap) targetWrap.hidden = false;
    } else {
      if (targetWrap) targetWrap.hidden = true;
      if (dictBtn) dictBtn.hidden = true;
    }

    showScreen('result');
  }

  document.getElementById('qc-replay')?.addEventListener('click', () => {
    if (state) startGame(state.bandId);
  });

  document.getElementById('qc-change-band')?.addEventListener('click', () => {
    stopTimer();
    state = null;
    showScreen('start');
  });

  window.addEventListener('pagehide', stopTimer);

  renderBands();
  showScreen('start');
}
