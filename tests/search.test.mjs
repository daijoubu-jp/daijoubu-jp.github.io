/**
 * Tests for assets/js/search.js (data loading cache + romaji conversion).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPromiseCache, romajiToHiragana, searchKanji, searchKanjiIndex, getDailyKanjiFromIndex } from '../assets/js/search.js';

const FIXTURE = [
  {
    kanji: '愛',
    onyomi: ['アイ'],
    kunyomi: [],
    jinmei: [],
    meanings_th: ['รัก', 'ความรัก'],
    meanings_en: ['love'],
  },
  {
    kanji: '山',
    onyomi: [],
    kunyomi: ['やま'],
    jinmei: [],
    meanings_th: ['ภูเขา'],
    meanings_en: ['mountain'],
  },
  {
    kanji: '一',
    onyomi: ['イチ'],
    kunyomi: ['ひと'],
    jinmei: [],
    meanings_th: ['หนึ่ง'],
    meanings_en: ['one'],
  },
];

test('createPromiseCache calls the loader once for concurrent gets', async () => {
  let calls = 0;
  const cache = createPromiseCache(async () => {
    calls += 1;
    return 'data';
  });

  const [a, b] = await Promise.all([cache.get(), cache.get()]);

  assert.equal(calls, 1);
  assert.equal(a, 'data');
  assert.equal(b, 'data');

  await cache.get();
  assert.equal(calls, 1);
});

test('createPromiseCache resets after a rejection so the next get retries', async () => {
  let calls = 0;
  const cache = createPromiseCache(async () => {
    calls += 1;
    if (calls === 1) throw new Error('boom');
    return 'ok';
  });

  await assert.rejects(cache.get(), /boom/);
  assert.equal(await cache.get(), 'ok');
  assert.equal(calls, 2);
});

test('romajiToHiragana converts basic romaji', () => {
  assert.equal(romajiToHiragana('kanji'), 'かんじ');
  assert.equal(romajiToHiragana('sakura'), 'さくら');
  assert.equal(romajiToHiragana('ai'), 'あい');
  assert.equal(romajiToHiragana(''), '');
});

test('searchKanji ranks an exact kanji match first (injected data)', async () => {
  const results = await searchKanji('山', { data: FIXTURE, limit: 3 });
  assert.equal(results[0].kanji, '山');
});

test('searchKanjiIndex matches romaji readings', () => {
  const results = searchKanjiIndex(FIXTURE, 'yama', { limit: 5 });
  assert.equal(results[0].kanji, '山');
});

test('searchKanjiIndex matches a second Thai meaning', () => {
  const results = searchKanjiIndex(FIXTURE, 'ความรัก', { limit: 5 });
  assert.equal(results[0].kanji, '愛');
});

test('searchKanjiIndex returns nothing for an empty query and respects limit', () => {
  assert.deepEqual(searchKanjiIndex(FIXTURE, ''), []);
  assert.equal(searchKanjiIndex(FIXTURE, 'love', { limit: 1 }).length, 1);
});

test('getDailyKanjiFromIndex is deterministic within one day', () => {
  const morning = getDailyKanjiFromIndex(FIXTURE, new Date('2026-09-11T08:00:00'));
  const night = getDailyKanjiFromIndex(FIXTURE, new Date('2026-09-11T23:59:59'));
  assert.ok(FIXTURE.includes(morning));
  assert.equal(morning.kanji, night.kanji);
});
