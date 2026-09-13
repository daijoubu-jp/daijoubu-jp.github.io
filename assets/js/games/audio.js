/**
 * audio.js - Synthesized Web Audio API sound effects for Daijoubu JP games.
 *
 * Uses native Web Audio API oscillators and gain envelopes to produce
 * delightful, crisp sound cues with 0 external audio files and 0 KB network payload.
 *
 * Handles browser autoplay policies cleanly by resuming the AudioContext
 * on user interaction.
 */

const STORAGE_KEY = 'kanji-game-sound';

let audioCtx = null;

/**
 * Gets or creates the shared AudioContext instance safely.
 * Returns null if Web Audio API is not supported or running in non-browser env.
 *
 * @returns {AudioContext|null}
 */
export function getAudioContext() {
  if (audioCtx && audioCtx.state !== 'closed') return audioCtx;
  if (typeof window === 'undefined') return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      try {
        audioCtx = new AudioCtxClass();
      } catch {
        audioCtx = null;
      }
    } else {
      audioCtx = null;
    }
  }
  return audioCtx;
}

/**
 * Resets or overrides the internal audio context reference (primarily for tests).
 *
 * @param {AudioContext|null} [mock=null]
 */
export function _resetAudioContextForTest(mock = null) {
  audioCtx = mock;
}

/**
 * Unlocks the AudioContext if it was suspended or interrupted due to browser autoplay policy.
 * Also triggers a silent 1-sample buffer to satisfy iOS WebKit hardware audio unlocking.
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    ctx.resume().catch(() => {});
    // Cross-browser iOS Safari unlocking: play silent 1-sample buffer on user gesture
    try {
      if (typeof ctx.createBuffer === 'function') {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch {}
  }
}

// Auto-register unlock listener on first user gesture
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const unlock = () => {
    unlockAudio();
    ['pointerdown', 'touchstart', 'touchend', 'keydown', 'click'].forEach((evt) => {
      window.removeEventListener(evt, unlock, { capture: true });
    });
  };
  ['pointerdown', 'touchstart', 'touchend', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, unlock, { capture: true, passive: true });
  });
}

let inMemorySoundEnabled = true;

/**
 * Checks whether game sound is enabled.
 * Defaults to true.
 *
 * @returns {boolean}
 */
export function isSoundEnabled() {
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val !== null) return val === 'true';
    } catch {}
  }
  return inMemorySoundEnabled;
}

/**
 * Sets the sound enabled preference and updates all toggle buttons.
 *
 * @param {boolean} enabled
 */
export function setSoundEnabled(enabled) {
  inMemorySoundEnabled = Boolean(enabled);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
  }
  updateSoundButtons();
}

/**
 * Toggles sound enabled state and returns new state.
 *
 * @returns {boolean}
 */
export function toggleSound() {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

/**
 * Updates UI labels and icons for all sound toggle buttons in the document.
 */
export function updateSoundButtons() {
  if (typeof document === 'undefined') return;
  const enabled = isSoundEnabled();
  const buttons = document.querySelectorAll('.game-sound-toggle, [data-sound-toggle]');
  buttons.forEach((btn) => {
    btn.textContent = enabled ? '🔊' : '🔇';
    btn.setAttribute('aria-label', enabled ? 'ปิดเสียงเอฟเฟกต์ (Sound ON)' : 'เปิดเสียงเอฟเฟกต์ (Sound OFF)');
    btn.title = enabled ? 'ปิดเสียง (Sound: ON)' : 'เปิดเสียง (Sound: OFF)';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  });
}

/**
 * Initializes all sound toggle buttons on the page.
 */
export function initSoundToggle() {
  if (typeof document === 'undefined') return;
  updateSoundButtons();
  const buttons = document.querySelectorAll('.game-sound-toggle, [data-sound-toggle]');
  buttons.forEach((btn) => {
    if (btn.getAttribute('data-sound-bound') === 'true') return;
    btn.setAttribute('data-sound-bound', 'true');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockAudio();
      const enabled = toggleSound();
      if (enabled) {
        playCorrect();
      }
    });
  });
}

/**
 * Synthesizes a pleasant soft high chime (pentatonic sine wave).
 * Used for correct tile selection or positive guess clue.
 */
export function playCorrect() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  unlockAudio();

  const now = ctx.currentTime;

  // Dual tone chime: E5 (659.25 Hz) then B5 (987.77 Hz)
  const notes = [
    { freq: 659.25, time: now, dur: 0.18, peakGain: 0.12 },
    { freq: 987.77, time: now + 0.07, dur: 0.22, peakGain: 0.14 }
  ];

  notes.forEach(({ freq, time, dur, peakGain }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = Math.max(time, ctx.currentTime);
      const attackTime = startTime + 0.015;
      const decayTime = startTime + dur;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, attackTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, decayTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(decayTime + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  });
}

/**
 * Synthesizes a gentle low tone / thud.
 * Used for wrong tile, penalty, or invalid guess.
 */
export function playWrong() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  unlockAudio();

  const dur = 0.22;
  const startTime = ctx.currentTime;
  const attackTime = startTime + 0.015;
  const decayTime = startTime + dur;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Gentle downward frequency ramp: 160 Hz down to 85 Hz
    osc.frequency.setValueAtTime(160, startTime);
    osc.frequency.exponentialRampToValueAtTime(85, decayTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.16, attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, decayTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(decayTime + 0.05);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  } catch {}
}

/**
 * Synthesizes a celebratory ascending arpeggio fanfare.
 * Used for round clear, win, or high score.
 */
export function playWin() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  unlockAudio();

  const now = ctx.currentTime;

  // Ascending major/pentatonic arpeggio: C5, E5, G5, C6
  const arpeggio = [
    { freq: 523.25, time: now, dur: 0.2, peakGain: 0.10 },
    { freq: 659.25, time: now + 0.09, dur: 0.2, peakGain: 0.11 },
    { freq: 783.99, time: now + 0.18, dur: 0.25, peakGain: 0.12 },
    { freq: 1046.50, time: now + 0.27, dur: 0.45, peakGain: 0.15 }
  ];

  arpeggio.forEach(({ freq, time, dur, peakGain }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = Math.max(time, ctx.currentTime);
      const attackTime = startTime + 0.02;
      const decayTime = startTime + dur;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, attackTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, decayTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(decayTime + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  });
}

/**
 * Alias for playWin, matching celebratory fanfare requirements.
 */
export const playFanfare = playWin;
