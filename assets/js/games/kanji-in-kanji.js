/**
 * kanji-in-kanji.js
 * -----------------
 * DOM controller for the Kanji in Kanji game. Rules live in
 * kanji-in-kanji-core.js; this file wires them to the page.
 */

import { BANDS, filterPool } from './time-attack-core.js';
import { makePuzzles, isComplete } from './kanji-in-kanji-core.js';
import { loadSearchIndex, loadKanjiComponents } from '../search.js';
import { getGameResult, saveGameResult } from '../storage.js';
import { initSoundToggle, playCorrect, playWrong, playWin } from './audio.js';

const GAME_ID = 'kanji-in-kanji';
const ROUND_SECONDS = 60;
const PUZZLE_CHUNK = 400;
const DECOY_COUNT = 4;
const WRONG_PENALTY_MS = 2000;
const COMPLETE_DELAY_MS = 450;
const WRONG_DELAY_MS = 450;

export async function initKanjiInKanji() {
  const startScreen = document.getElementById('kik-start');
  const gameScreen = document.getElementById('kik-game');
  const resultScreen = document.getElementById('kik-result');
  if (!startScreen || !gameScreen || !resultScreen) return;

  initSoundToggle();

  const bandsEl = document.getElementById('kik-bands');
  const tilesEl = document.getElementById('kik-tiles');
  const kanjiEl = document.getElementById('kik-kanji');
  const scoreEl = document.getElementById('kik-score');
  const timeEl = document.getElementById('kik-time');
  const timerFill = document.getElementById('kik-timer-fill');
  const timerEl = document.getElementById('kik-timer');
  const feedbackEl = document.getElementById('kik-feedback');
  const finalEl = document.getElementById('kik-final');
  const bestEl = document.getElementById('kik-best');
  const newBestEl = document.getElementById('kik-newbest');

  let timerId = null;
  let state = null;

  const [index, components] = await Promise.all([loadSearchIndex(), loadKanjiComponents()]);
  const entries = components.entries || {};
  const pool = components.pool || [];

  const bands = BANDS
    .map((band) => ({
      ...band,
      targets: filterPool(index, band.id)
        .map((entry) => entry.kanji)
        .filter((kanji) => entries[kanji]),
    }))
    .filter((band) => band.targets.length >= 4);

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
        <span class="band-chip-count">${band.targets.length} ตัว</span>
      </button>
    `).join('');

    bandsEl.querySelectorAll('.band-chip').forEach((btn) => {
      btn.addEventListener('click', () => startGame(btn.dataset.band));
    });
  }

  function currentPuzzle() {
    return state.puzzles[state.index % state.puzzles.length];
  }

  function renderPuzzle() {
    const puzzle = currentPuzzle();
    state.selected = new Set();
    kanjiEl.textContent = puzzle.kanji;
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('is-complete', 'is-wrong');

    tilesEl.innerHTML = puzzle.tiles.map((component) => `
      <button type="button" class="kik-tile" data-component="${component}">${component}</button>
    `).join('');

    tilesEl.querySelectorAll('.kik-tile').forEach((tile) => {
      tile.addEventListener('click', () => selectTile(tile));
    });
  }

  function selectTile(tile) {
    if (!state || state.locked) return;
    const component = tile.dataset.component;
    const puzzle = currentPuzzle();
    if (state.selected.has(component)) return;

    if (puzzle.components.includes(component)) {
      state.selected.add(component);
      tile.classList.add('selected');
      feedbackEl.textContent = '';
      feedbackEl.classList.remove('is-wrong');

      if (isComplete([...state.selected], puzzle.components)) {
        state.locked = true;
        state.score += 1;
        scoreEl.textContent = String(state.score);
        feedbackEl.textContent = 'ครบแล้ว!';
        feedbackEl.classList.add('is-complete');
        playWin();
        window.setTimeout(nextPuzzle, COMPLETE_DELAY_MS);
      } else {
        playCorrect();
      }
      return;
    }

    // Wrong tile: brief red flash and a small time penalty.
    state.locked = true;
    tile.classList.add('wrong');
    feedbackEl.textContent = 'ไม่ใช่ส่วนประกอบ';
    feedbackEl.classList.add('is-wrong');
    state.endAt -= WRONG_PENALTY_MS;
    playWrong();
    window.setTimeout(() => {
      tile.classList.remove('wrong');
      if (!state) return;
      state.locked = false;
    }, WRONG_DELAY_MS);
  }

  function nextPuzzle() {
    if (!state) return;
    state.index += 1;
    state.locked = false;
    renderPuzzle();
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
      puzzles: makePuzzles(band.targets, entries, pool, PUZZLE_CHUNK, DECOY_COUNT),
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
    renderPuzzle();
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
    if (state.score > 0) playWin();

    const targetWrap = document.getElementById('kik-target-wrap');
    const targetEl = document.getElementById('kik-target');
    const targetLink = document.getElementById('kik-target-link');
    const dictBtn = document.getElementById('kik-dict-btn');

    const currentPuzzle = state.puzzles && state.puzzles.length > 0
      ? state.puzzles[state.index % state.puzzles.length]
      : null;
    const target = currentPuzzle?.kanji;
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

  document.getElementById('kik-replay')?.addEventListener('click', () => {
    if (state) startGame(state.bandId);
  });

  document.getElementById('kik-change-band')?.addEventListener('click', () => {
    stopTimer();
    state = null;
    showScreen('start');
  });

  window.addEventListener('pagehide', stopTimer);

  renderBands();
  showScreen('start');
}
