/**
 * Tests for assets/js/search.js (data loading cache + romaji conversion).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createPromiseCache, romajiToHiragana, searchKanji, searchKanjiIndex, getDailyKanjiFromIndex, filterKanji } from '../assets/js/search.js';

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

const FILTER_FIXTURE = [
  { kanji: '山', joyo: true, grade: 3, kanken: '8', nameUse: true },
  { kanji: '亜', joyo: true, grade: 8, kanken: '2', nameUse: true },
  { kanji: '硫', joyo: true, grade: 8, kanken: '4', nameUse: true },
  { kanji: '刹', joyo: false, grade: null, kanken: 'jun1', nameUse: false },
];

test('filterKanji: both scope boxes checked = all kanji', async () => {
  const out = await filterKanji({ joyoOnly: true, nonJoyoOnly: true }, { data: FILTER_FIXTURE });
  assert.equal(out.length, 4);
});

test('filterKanji: one scope box checked filters', async () => {
  const out = await filterKanji({ joyoOnly: true, nonJoyoOnly: false }, { data: FILTER_FIXTURE });
  assert.deepEqual(out.map(k => k.kanji), ['山', '亜', '硫']);
});

test('filterKanji: school stage maps to Kanken levels', async () => {
  const mid = await filterKanji({ grade: ['mid'] }, { data: FILTER_FIXTURE });
  const high = await filterKanji({ grade: ['high'] }, { data: FILTER_FIXTURE });
  const univ = await filterKanji({ grade: ['univ'] }, { data: FILTER_FIXTURE });
  assert.deepEqual(mid.map(k => k.kanji), ['硫']);
  assert.deepEqual(high.map(k => k.kanji), ['亜']);
  assert.deepEqual(univ.map(k => k.kanji), ['刹']);
});

test('filterKanji: nameUseOnly keeps only name-legal kanji', async () => {
  const out = await filterKanji({ nameUseOnly: true }, { data: FILTER_FIXTURE });
  assert.deepEqual(out.map(k => k.kanji), ['山', '亜', '硫']);
});

const THAI_EXACT_FIXTURE = [
  { kanji: '省', onyomi: [], kunyomi: [], meanings_th: ['อนุรักษ์'], meanings_en: ['conserve'] },
  { kanji: '愛', onyomi: [], kunyomi: [], meanings_th: ['รัก'], meanings_en: ['love'] },
];

test('searchKanjiIndex ranks exact Thai meaning above substring', () => {
  const r = searchKanjiIndex(THAI_EXACT_FIXTURE, 'รัก', { limit: 2 });
  assert.equal(r[0].kanji, '愛');
});

test('search-index minification: omits empty hyougai arrays and preserves non-empty ones', () => {
  const raw = readFileSync(
    fileURLToPath(new URL('../data/search-index.min.json', import.meta.url)),
    'utf8'
  );
  const index = JSON.parse(raw);

  let omittedCount = 0;
  let presentCount = 0;

  for (const item of index) {
    if ('onyomi_hyougai' in item) {
      assert.ok(Array.isArray(item.onyomi_hyougai), `${item.kanji} onyomi_hyougai must be array`);
      assert.ok(item.onyomi_hyougai.length > 0, `${item.kanji} must omit empty onyomi_hyougai`);
      presentCount += 1;
    } else {
      omittedCount += 1;
    }

    if ('kunyomi_hyougai' in item) {
      assert.ok(Array.isArray(item.kunyomi_hyougai), `${item.kanji} kunyomi_hyougai must be array`);
      assert.ok(item.kunyomi_hyougai.length > 0, `${item.kanji} must omit empty kunyomi_hyougai`);
      presentCount += 1;
    }
  }

  assert.ok(omittedCount > 1000, 'expected over 1000 omitted empty hyougai arrays');
  assert.ok(presentCount > 500, 'expected valid present hyougai readings preserved');

  // Verify search compatibility with and without hyougai fields
  const yama = index.find(item => item.kanji === '山');
  assert.ok(yama && yama.onyomi_hyougai && yama.onyomi_hyougai.includes('セン'));
  // In the full 5867-kanji index, 89 kanji have 'セン' as primary Joyo/Jinmeiyou onyomi (+150),
  // ranking above hyougai onyomi matches (+120). Limit >= 100 is required (using 120 for margin).
  const senResults = searchKanjiIndex(index, 'sen', { limit: 120 });
  assert.ok(senResults.some(r => r.kanji === '山'), 'should match hyougai onyomi sen for 山');

  const ichi = index.find(item => item.kanji === '一');
  assert.equal(ichi.onyomi_hyougai, undefined, '一 should omit empty onyomi_hyougai');
  const ichiResults = searchKanjiIndex(index, 'ichi', { limit: 50 });
  assert.ok(ichiResults.some(r => r.kanji === '一'), 'should match joyo onyomi ichi for 一 without throwing');
});

