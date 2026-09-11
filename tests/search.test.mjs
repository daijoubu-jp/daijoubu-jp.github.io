/**
 * Tests for assets/js/search.js (data loading cache + romaji conversion).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPromiseCache, romajiToHiragana } from '../assets/js/search.js';

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
