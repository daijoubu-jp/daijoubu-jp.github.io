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

test('games hub exposes exactly one live game', () => {
  assert.equal((html.match(/class="hub-card"/g) || []).length, 1);
  assert.match(html, /href="time-attack.html" class="hub-card"/);
});

test('games hub lists two disabled placeholders', () => {
  assert.equal((html.match(/class="hub-card disabled"/g) || []).length, 2);
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
  assert.match(page, /class="ta-scoreboard"/);
  assert.match(page, /class="ta-stat-label">คะแนน/);
  assert.match(page, /class="ta-stat-label">เหลือเวลา/);
  assert.match(page, /id="ta-timer"[^>]*role="progressbar"/);
});
