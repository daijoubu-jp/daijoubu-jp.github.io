/**
 * Unit tests for game audio module (assets/js/games/audio.js).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSoundEnabled,
  setSoundEnabled,
  toggleSound,
  playCorrect,
  playWrong,
  playWin,
  playFanfare,
  getAudioContext,
  unlockAudio,
  initSoundToggle,
  updateSoundButtons,
} from '../assets/js/games/audio.js';

test('audio module exports all required sound and state functions', () => {
  assert.equal(typeof isSoundEnabled, 'function');
  assert.equal(typeof setSoundEnabled, 'function');
  assert.equal(typeof toggleSound, 'function');
  assert.equal(typeof playCorrect, 'function');
  assert.equal(typeof playWrong, 'function');
  assert.equal(typeof playWin, 'function');
  assert.equal(typeof playFanfare, 'function');
  assert.equal(typeof getAudioContext, 'function');
  assert.equal(typeof unlockAudio, 'function');
  assert.equal(typeof initSoundToggle, 'function');
  assert.equal(typeof updateSoundButtons, 'function');
});

test('sound preferences toggle and persist correctly', () => {
  // Sound defaults to enabled
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);

  // Toggle to false
  const toggledOff = toggleSound();
  assert.equal(toggledOff, false);
  assert.equal(isSoundEnabled(), false);

  // Toggle back to true
  const toggledOn = toggleSound();
  assert.equal(toggledOn, true);
  assert.equal(isSoundEnabled(), true);

  // Explicit set
  setSoundEnabled(false);
  assert.equal(isSoundEnabled(), false);
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);
});

test('audio playback functions degrade safely without AudioContext in Node environment', () => {
  assert.doesNotThrow(() => {
    playCorrect();
    playWrong();
    playWin();
    playFanfare();
    unlockAudio();
    initSoundToggle();
    updateSoundButtons();
  });
});
