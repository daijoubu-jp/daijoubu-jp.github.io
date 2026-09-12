/**
 * time-attack.js
 * --------------
 * DOM controller for the Kanji Time Attack game. Game rules live in
 * time-attack-core.js; this file only wires them to the page.
 */

import { BANDS, filterPool, makeQuestions, scoreResult } from './time-attack-core.js';
import { loadSearchIndex } from '../search.js';
import { getGameResult, saveGameResult } from '../storage.js';

const GAME_ID = 'time-attack';
const ROUND_SECONDS = 60;
const QUESTION_CHUNK = 300;
const CORRECT_DELAY_MS = 250;
const WRONG_DELAY_MS = 900;

export async function initTimeAttack() {
  const startScreen = document.getElementById('ta-start');
  const gameScreen = document.getElementById('ta-game');
  const resultScreen = document.getElementById('ta-result');
  if (!startScreen || !gameScreen || !resultScreen) return;

  const bandsEl = document.getElementById('ta-bands');
  const optionsEl = document.getElementById('ta-options');
  const kanjiEl = document.getElementById('ta-kanji');
  const scoreEl = document.getElementById('ta-score');
  const timeEl = document.getElementById('ta-time');
  const timerFill = document.getElementById('ta-timer-fill');
  const timerEl = document.getElementById('ta-timer');
  const feedbackEl = document.getElementById('ta-feedback');
  const finalEl = document.getElementById('ta-final');
  const bestEl = document.getElementById('ta-best');
  const newBestEl = document.getElementById('ta-newbest');

  let timerId = null;
  let state = null;

  let index = [];
  try {
    index = await loadSearchIndex();
  } catch {
    index = [];
  }

  const bands = BANDS
    .map((band) => ({ ...band, pool: filterPool(index, band.id) }))
    .filter((band) => band.pool.length >= 4);

  if (bands.length === 0) {
    startScreen.innerHTML = '<p class="game-empty">ไม่สามารถโหลดข้อมูลคันจิได้ในขณะนี้ กรุณาลองใหม่ภายหลัง</p>';
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
        <span class="band-chip-count">${band.pool.length} ตัว</span>
      </button>
    `).join('');

    bandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => startGame(btn.dataset.band));
    });
  }

  function renderQuestion() {
    const question = state.questions[state.index % state.questions.length];
    kanjiEl.textContent = question.kanji;
    optionsEl.innerHTML = question.options.map((option, i) => {
      const correctAttr = option === question.correct ? ' data-correct="true"' : '';
      return `<button type="button" class="ta-option" data-option="${i}"${correctAttr}>
        <span class="ta-option-key">${i + 1}</span><span class="ta-option-text">${option}</span>
      </button>`;
    }).join('');

    optionsEl.querySelectorAll('.ta-option').forEach((btn) => {
      btn.addEventListener('click', () => answer(Number(btn.dataset.option)));
    });
  }

  function answer(optionIndex) {
    if (!state || state.locked) return;
    const question = state.questions[state.index % state.questions.length];
    const chosen = question.options[optionIndex];
    if (chosen === undefined) return;

    state.locked = true;
    const clicked = optionsEl.querySelector(`[data-option="${optionIndex}"]`);
    const isCorrect = chosen === question.correct;

    if (isCorrect) {
      state.score += 1;
      scoreEl.textContent = String(state.score);
      clicked?.classList.add('correct');
      feedbackEl.textContent = 'ถูกต้อง!';
      feedbackEl.classList.add('is-correct');
    } else {
      clicked?.classList.add('wrong');
      optionsEl.querySelector('[data-correct="true"]')?.classList.add('correct');
      feedbackEl.textContent = `เฉลย: ${question.correct}`;
      feedbackEl.classList.remove('is-correct');
    }

    window.setTimeout(() => {
      if (!state) return;
      state.locked = false;
      state.index += 1;
      feedbackEl.textContent = '';
      feedbackEl.classList.remove('is-correct');
      renderQuestion();
    }, isCorrect ? CORRECT_DELAY_MS : WRONG_DELAY_MS);
  }

  function startTimer() {
    stopTimer();
    const startedAt = Date.now();
    timerId = window.setInterval(() => {
      if (!state) return;
      const remaining = Math.max(0, ROUND_SECONDS - (Date.now() - startedAt) / 1000);
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
      questions: makeQuestions(band.pool, QUESTION_CHUNK),
      index: 0,
      score: 0,
      locked: false,
    };

    scoreEl.textContent = '0';
    timeEl.textContent = String(ROUND_SECONDS);
    timerFill.style.width = '100%';
    timerEl?.setAttribute('aria-valuenow', String(ROUND_SECONDS));
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('is-correct');
    newBestEl.hidden = true;

    showScreen('game');
    renderQuestion();
    startTimer();
  }

  function endGame() {
    stopTimer();
    if (!state) return;

    const previous = getGameResult(GAME_ID, state.bandId);
    const { isNewBest } = scoreResult(state.score, previous.best);
    const saved = saveGameResult(GAME_ID, state.bandId, state.score);

    finalEl.textContent = String(state.score);
    bestEl.textContent = String(saved.best);
    newBestEl.hidden = !isNewBest;
    showScreen('result');
  }

  document.getElementById('ta-replay')?.addEventListener('click', () => {
    if (state) startGame(state.bandId);
  });

  document.getElementById('ta-change-band')?.addEventListener('click', () => {
    stopTimer();
    state = null;
    showScreen('start');
  });

  document.addEventListener('keydown', (event) => {
    if (gameScreen.hidden || !state || state.locked) return;
    const optionIndex = ['1', '2', '3', '4'].indexOf(event.key);
    if (optionIndex !== -1) answer(optionIndex);
  });

  window.addEventListener('pagehide', stopTimer);

  renderBands();
  showScreen('start');
}
