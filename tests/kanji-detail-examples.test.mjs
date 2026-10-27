import test from 'node:test';
import assert from 'node:assert/strict';
import { selectSupplementaryCompounds } from '../assets/js/kanji-detail.js';

const SAMPLE_COMPOUNDS = {
  words: [
    ['一番', 'いちばん', 'number one; first', 'อันดับหนึ่ง'],
    ['一人', 'ひとり', 'one person; alone', 'คนเดียว'],
    ['一般', 'いっぱん', 'general; ordinary', ''],
    ['一生', 'いっしょう', 'whole life; lifetime', 'ตลอดชีวิต'],
    ['一昨日', 'おととい', 'day before yesterday', ''],
    ['一致', 'いっち', 'agreement; match', 'ความสอดคล้อง'],
  ],
  byKanji: {
    '一': [0, 1, 2, 3, 4, 5],
  },
};

test('selectSupplementaryCompounds deduplicates against curated examples and prioritizes Thai meanings', () => {
  const curated = [
    { word: '一番', reading: 'いちばん', meaning_th: 'อันดับหนึ่ง' },
    { word: '一人', reading: 'ひとり', meaning_th: 'คนเดียว' },
  ];

  const result = selectSupplementaryCompounds('一', curated, SAMPLE_COMPOUNDS, 8);
  assert.equal(result.length, 4);
  assert.deepEqual(
    result.map((r) => r.word),
    ['一生', '一致', '一般', '一昨日']
  );
  assert.equal(result[0].meaning_th, 'ตลอดชีวิต');
  assert.equal(result[1].meaning_th, 'ความสอดคล้อง');
});

test('selectSupplementaryCompounds respects maxCount and handles missing kanji or null data gracefully', () => {
  const capped = selectSupplementaryCompounds('一', [], SAMPLE_COMPOUNDS, 2);
  assert.equal(capped.length, 2);
  assert.deepEqual(capped.map((r) => r.word), ['一番', '一人']);

  assert.deepEqual(selectSupplementaryCompounds('龍', [], SAMPLE_COMPOUNDS, 8), []);
  assert.deepEqual(selectSupplementaryCompounds('一', [], null, 8), []);
});
