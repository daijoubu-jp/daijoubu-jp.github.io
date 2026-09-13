/**
 * Guards the games hub: one live game plus the two planned placeholders.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(
  fileURLToPath(new URL('../games/index.html', import.meta.url)),
  'utf8'
);

test('games hub exposes all four live games', () => {
  assert.equal((html.match(/class="hub-card"/g) || []).length, 4);
  assert.match(html, /href="time-attack.html" class="hub-card"/);
  assert.match(html, /href="kanji-in-kanji.html" class="hub-card"/);
  assert.match(html, /href="quick-compound.html" class="hub-card"/);
  assert.match(html, /href="kanji-wordle.html" class="hub-card"/);
});

test('games hub lists no disabled placeholders', () => {
  assert.equal((html.match(/class="hub-card disabled"/g) || []).length, 0);
});

test('games hub titles are present', () => {
  assert.match(html, /漢字タイムショック/);
  assert.match(html, /漢字の中に漢字/);
  assert.match(html, /スピード熟語/);
});

test('time attack page has the scoreboard HUD layout', () => {
  const page = readFileSync(
    fileURLToPath(new URL('../games/time-attack.html', import.meta.url)),
    'utf8'
  );
  assert.match(page, /class="game-scoreboard"/);
  assert.match(page, /class="game-stat-label">คะแนน/);
  assert.match(page, /class="game-stat-label">เหลือเวลา/);
  assert.match(page, /id="ta-timer"[^>]*role="progressbar"/);
});

test('all four game result screens feature a dictionary bridge action and target link', () => {
  const games = [
    { file: '../games/kanji-wordle.html', targetId: 'kwl-target-link', dictId: 'kwl-dict-btn' },
    { file: '../games/time-attack.html', targetId: 'ta-target-link', dictId: 'ta-dict-btn' },
    { file: '../games/quick-compound.html', targetId: 'qc-target-link', dictId: 'qc-dict-btn' },
    { file: '../games/kanji-in-kanji.html', targetId: 'kik-target-link', dictId: 'kik-dict-btn' },
  ];

  for (const game of games) {
    const pageHtml = readFileSync(fileURLToPath(new URL(game.file, import.meta.url)), 'utf8');
    assert.match(pageHtml, new RegExp(`id="${game.targetId}"[^>]*target="_blank"[^>]*rel="noopener"`));
    assert.match(pageHtml, new RegExp(`id="${game.dictId}"[^>]*target="_blank"[^>]*rel="noopener"`));
    assert.match(pageHtml, /ดูคันจินี้ในพจนานุกรม/);
  }
});

test('kanji wordle page exposes share result button and toast notification', () => {
  const pageHtml = readFileSync(fileURLToPath(new URL('../games/kanji-wordle.html', import.meta.url)), 'utf8');
  assert.match(pageHtml, /id="kwl-share"/);
  assert.match(pageHtml, /แชร์ผลลัพธ์/);
  assert.match(pageHtml, /id="toast"[^>]*class="[^"]*toast-container/);
});

test('all four game pages feature persistent sound toggle button in the HUD', () => {
  const games = [
    { file: '../games/kanji-wordle.html', toggleId: 'kwl-sound-toggle' },
    { file: '../games/time-attack.html', toggleId: 'ta-sound-toggle' },
    { file: '../games/quick-compound.html', toggleId: 'qc-sound-toggle' },
    { file: '../games/kanji-in-kanji.html', toggleId: 'kik-sound-toggle' },
  ];

  for (const game of games) {
    const pageHtml = readFileSync(fileURLToPath(new URL(game.file, import.meta.url)), 'utf8');
    assert.match(pageHtml, new RegExp(`class="game-sound-toggle"[^>]*id="${game.toggleId}"`));
    assert.match(pageHtml, new RegExp(`id="${game.toggleId}"[^>]*aria-pressed="true"`));
    assert.match(pageHtml, /class="game-hud-header"/);
  }
});

