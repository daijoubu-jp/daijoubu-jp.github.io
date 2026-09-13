/**
 * Tests for the Worksheet generator (worksheet.js) bundle optimization
 * and required data schema integrity.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { searchKanjiIndex } from '../assets/js/search.js';

const searchIndexRaw = readFileSync(
  fileURLToPath(new URL('../data/search-index.min.json', import.meta.url)),
  'utf8'
);
const searchIndex = JSON.parse(searchIndexRaw);

test('worksheet.js imports loadSearchIndex and searchKanjiIndex instead of heavy full bundle', () => {
  const js = readFileSync(
    fileURLToPath(new URL('../assets/js/worksheet.js', import.meta.url)),
    'utf8'
  );
  assert.match(js, /import\s*\{[^}]*loadSearchIndex[^}]*\}\s*from\s*['"]\.\/search\.js['"]/);
  assert.match(js, /import\s*\{[^}]*searchKanjiIndex[^}]*\}\s*from\s*['"]\.\/search\.js['"]/);
  assert.ok(!js.includes('loadKanjiData'), 'worksheet.js must not load full kanji.min.json');
  assert.ok(!js.includes('data/kanji.min.json'), 'worksheet.js must not reference kanji.min.json');
});

test('search index entries provide all fields required by worksheet.js', () => {
  const joyoEntries = searchIndex.filter((entry) => entry.joyo);
  assert.equal(joyoEntries.length, 2136);

  for (const entry of joyoEntries) {
    assert.ok(entry.kanji, 'missing kanji char');
    assert.ok(Array.isArray(entry.onyomi), `${entry.kanji} missing onyomi array`);
    assert.ok(Array.isArray(entry.kunyomi), `${entry.kanji} missing kunyomi array`);
    assert.ok(Array.isArray(entry.meanings_th), `${entry.kanji} missing meanings_th array`);
    assert.ok(typeof entry.strokes === 'number', `${entry.kanji} missing strokes count`);
    assert.ok(entry.grade !== undefined, `${entry.kanji} missing grade field`);
  }
});

test('searchKanjiIndex powers the worksheet character picker panel', () => {
  // Search by Thai meaning
  const waterResults = searchKanjiIndex(searchIndex, 'น้ำ', { limit: 10 });
  assert.ok(waterResults.some((k) => k.kanji === '水'));

  // Search by romaji
  const aiResults = searchKanjiIndex(searchIndex, 'ai', { limit: 10 });
  assert.ok(aiResults.some((k) => k.kanji === '愛'));

  // Search by exact kanji
  const exact = searchKanjiIndex(searchIndex, '日', { limit: 5 });
  assert.equal(exact[0].kanji, '日');
});

test('worksheet.html exposes all required UI controls and container', () => {
  const html = readFileSync(
    fileURLToPath(new URL('../tools/worksheet.html', import.meta.url)),
    'utf8'
  );
  assert.match(html, /id="ws-preset-select"/);
  assert.match(html, /id="ws-custom-input"/);
  assert.match(html, /id="ws-search-kanji-btn"/);
  assert.match(html, /id="ws-picker-search-input"/);
  assert.match(html, /id="ws-picker-results"/);
  assert.match(html, /id="ws-print-btn"/);
  assert.match(html, /id="worksheet-pages-container"/);
});
