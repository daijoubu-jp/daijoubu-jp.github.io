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

test('games hub exposes all three live games', () => {
  assert.equal((html.match(/class="hub-card"/g) || []).length, 3);
  assert.match(html, /href="time-attack.html" class="hub-card"/);
  assert.match(html, /href="kanji-in-kanji.html" class="hub-card"/);
  assert.match(html, /href="quick-compound.html" class="hub-card"/);
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
