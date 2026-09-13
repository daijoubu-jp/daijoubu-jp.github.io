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
  _resetAudioContextForTest,
} from '../assets/js/games/audio.js';

function createMockAudioContext(initialState = 'running') {
  const createdNodes = {
    oscillators: [],
    gains: [],
    bufferSources: [],
  };

  class MockParam {
    constructor(val = 0) {
      this.value = val;
      this.calls = [];
    }
    setValueAtTime(val, time) {
      this.calls.push({ type: 'setValueAtTime', val, time });
    }
    exponentialRampToValueAtTime(val, time) {
      this.calls.push({ type: 'exponentialRampToValueAtTime', val, time });
    }
  }

  const mock = {
    state: initialState,
    currentTime: 1.0,
    destination: { id: 'destination' },
    resumed: false,
    async resume() {
      mock.resumed = true;
      mock.state = 'running';
    },
    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: new MockParam(440),
        started: null,
        stopped: null,
        connected: [],
        connect(target) {
          osc.connected.push(target);
        },
        disconnect() {
          osc.disconnected = true;
        },
        start(time) {
          osc.started = time;
        },
        stop(time) {
          osc.stopped = time;
        },
      };
      createdNodes.oscillators.push(osc);
      return osc;
    },
    createGain() {
      const gain = {
        gain: new MockParam(1.0),
        connected: [],
        connect(target) {
          gain.connected.push(target);
        },
        disconnect() {
          gain.disconnected = true;
        },
      };
      createdNodes.gains.push(gain);
      return gain;
    },
    createBuffer(channels, length, sampleRate) {
      return { channels, length, sampleRate };
    },
    createBufferSource() {
      const source = {
        buffer: null,
        connected: [],
        started: null,
        connect(target) {
          source.connected.push(target);
        },
        start(time) {
          source.started = time;
        },
      };
      createdNodes.bufferSources.push(source);
      return source;
    },
    _nodes: createdNodes,
  };

  return mock;
}

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
  assert.equal(typeof _resetAudioContextForTest, 'function');
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
  _resetAudioContextForTest(null);
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

test('getAudioContext recreates context when existing one is closed', () => {
  const closedContext = createMockAudioContext('closed');
  _resetAudioContextForTest(closedContext);

  // Mock global window and AudioContext constructor
  const originalWindow = globalThis.window;
  let instantiated = 0;
  globalThis.window = {
    AudioContext: class {
      constructor() {
        instantiated += 1;
        this.state = 'running';
      }
    },
  };

  try {
    const fresh = getAudioContext();
    assert.equal(instantiated, 1);
    assert.ok(fresh);
    assert.equal(fresh.state, 'running');
  } finally {
    globalThis.window = originalWindow;
    _resetAudioContextForTest(null);
  }
});

test('unlockAudio resumes suspended or interrupted context and plays silent buffer', () => {
  const suspended = createMockAudioContext('suspended');
  _resetAudioContextForTest(suspended);

  unlockAudio();
  assert.equal(suspended.resumed, true);
  assert.equal(suspended._nodes.bufferSources.length, 1);
  assert.equal(suspended._nodes.bufferSources[0].started, 0);

  const interrupted = createMockAudioContext('interrupted');
  _resetAudioContextForTest(interrupted);
  unlockAudio();
  assert.equal(interrupted.resumed, true);

  _resetAudioContextForTest(null);
});

test('playCorrect synthesizes dual-tone pentatonic chime with correct envelope', () => {
  const mockCtx = createMockAudioContext('running');
  _resetAudioContextForTest(mockCtx);
  setSoundEnabled(true);

  playCorrect();

  assert.equal(mockCtx._nodes.oscillators.length, 2);
  assert.equal(mockCtx._nodes.gains.length, 2);

  const [osc1, osc2] = mockCtx._nodes.oscillators;
  assert.equal(osc1.type, 'sine');
  assert.equal(osc2.type, 'sine');

  assert.equal(osc1.frequency.calls[0].val, 659.25);
  assert.equal(osc2.frequency.calls[0].val, 987.77);

  const [gain1, gain2] = mockCtx._nodes.gains;
  assert.equal(gain1.gain.calls[0].val, 0.0001);
  assert.equal(gain1.gain.calls[1].val, 0.12);
  assert.equal(gain2.gain.calls[1].val, 0.14);

  _resetAudioContextForTest(null);
});

test('playWrong synthesizes gentle downward triangle ramp', () => {
  const mockCtx = createMockAudioContext('running');
  _resetAudioContextForTest(mockCtx);
  setSoundEnabled(true);

  playWrong();

  assert.equal(mockCtx._nodes.oscillators.length, 1);
  assert.equal(mockCtx._nodes.gains.length, 1);

  const osc = mockCtx._nodes.oscillators[0];
  assert.equal(osc.type, 'triangle');
  assert.equal(osc.frequency.calls[0].val, 160);
  assert.equal(osc.frequency.calls[1].val, 85);

  const gain = mockCtx._nodes.gains[0];
  assert.equal(gain.gain.calls[0].val, 0.0001);
  assert.equal(gain.gain.calls[1].val, 0.16);

  _resetAudioContextForTest(null);
});

test('playWin and playFanfare synthesize celebratory 4-note arpeggio', () => {
  const mockCtx = createMockAudioContext('running');
  _resetAudioContextForTest(mockCtx);
  setSoundEnabled(true);

  playWin();
  assert.equal(mockCtx._nodes.oscillators.length, 4);
  assert.equal(mockCtx._nodes.gains.length, 4);

  const freqs = mockCtx._nodes.oscillators.map(o => o.frequency.calls[0].val);
  assert.deepEqual(freqs, [523.25, 659.25, 783.99, 1046.50]);

  // playFanfare is an alias to playWin
  mockCtx._nodes.oscillators.length = 0;
  mockCtx._nodes.gains.length = 0;
  playFanfare();
  assert.equal(mockCtx._nodes.oscillators.length, 4);

  _resetAudioContextForTest(null);
});

test('all audio playback is cleanly suppressed when sound is disabled', () => {
  const mockCtx = createMockAudioContext('running');
  _resetAudioContextForTest(mockCtx);
  setSoundEnabled(false);

  playCorrect();
  playWrong();
  playWin();
  playFanfare();

  assert.equal(mockCtx._nodes.oscillators.length, 0);
  assert.equal(mockCtx._nodes.gains.length, 0);

  setSoundEnabled(true);
  _resetAudioContextForTest(null);
});

test('initSoundToggle wires toggle buttons, updates labels, and plays feedback chime on unmute', () => {
  const originalDoc = globalThis.document;
  const mockCtx = createMockAudioContext('running');
  _resetAudioContextForTest(mockCtx);

  class MockElement {
    constructor() {
      this.attrs = {};
      this.listeners = {};
      this.textContent = '';
    }
    getAttribute(name) {
      return this.attrs[name] || null;
    }
    setAttribute(name, val) {
      this.attrs[name] = String(val);
    }
    addEventListener(evt, fn) {
      this.listeners[evt] = fn;
    }
    click() {
      if (this.listeners.click) {
        this.listeners.click({ stopPropagation() {} });
      }
    }
  }

  const btn = new MockElement();
  globalThis.document = {
    querySelectorAll() {
      return [btn];
    },
  };

  try {
    setSoundEnabled(true);
    initSoundToggle();

    assert.equal(btn.getAttribute('data-sound-bound'), 'true');
    assert.equal(btn.textContent, '🔊');
    assert.equal(btn.getAttribute('aria-pressed'), 'true');

    // Click to mute
    btn.click();
    assert.equal(isSoundEnabled(), false);
    assert.equal(btn.textContent, '🔇');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    // Muting does not play chime
    assert.equal(mockCtx._nodes.oscillators.length, 0);

    // Click to unmute
    btn.click();
    assert.equal(isSoundEnabled(), true);
    assert.equal(btn.textContent, '🔊');
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    // Unmuting plays confirmation chime
    assert.equal(mockCtx._nodes.oscillators.length, 2);
  } finally {
    globalThis.document = originalDoc;
    _resetAudioContextForTest(null);
    setSoundEnabled(true);
  }
});
