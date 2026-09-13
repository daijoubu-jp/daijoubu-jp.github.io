/**
 * tests/chinese-zodiacs.test.mjs
 * Unit and contract tests for the 12 Chinese Zodiacs (十二支) interactive wheel.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ZODIACS,
  getZodiacIndexForDate,
  generateWheelSvg
} from '../assets/js/chinese-zodiacs.js';

test('ZODIACS array has exactly 12 branches with complete attributes', () => {
  assert.equal(ZODIACS.length, 12);

  const expectedKanji = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const expectedAnimals = ['หนู', 'วัว', 'เสือ', 'กระต่าย', 'มังกร', 'งู', 'ม้า', 'แพะ (แกะ)', 'ลิง', 'ไก่', 'สุนัข', 'หมูป่า'];
  const expectedElements = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

  ZODIACS.forEach((item, index) => {
    assert.equal(item.kanji, expectedKanji[index]);
    assert.equal(item.animalTh, expectedAnimals[index]);
    assert.equal(item.element, expectedElements[index]);
    assert.equal(item.degrees, index * 30);
    assert.ok(item.onyomi.length > 0, `${item.kanji} missing onyomi`);
    assert.ok(item.kunyomi.length > 0, `${item.kanji} missing kunyomi`);
    assert.ok(item.timeSpan.length > 0, `${item.kanji} missing timeSpan`);
    assert.ok(item.periodJp.length > 0, `${item.kanji} missing periodJp`);
    assert.ok(item.bellCountJp.length > 0, `${item.kanji} missing bellCountJp`);
    assert.ok(item.etymologyTh.length > 0, `${item.kanji} missing etymologyTh`);
    assert.ok(item.triviaTh.length > 0, `${item.kanji} missing triviaTh`);
  });
});

test('getZodiacIndexForDate accurately maps 24-hour clock to 12 branches', () => {
  // 23:15 -> 子 (index 0)
  const d23 = new Date(2026, 8, 13, 23, 15);
  assert.equal(getZodiacIndexForDate(d23), 0);

  // 00:45 -> 子 (index 0)
  const d00 = new Date(2026, 8, 13, 0, 45);
  assert.equal(getZodiacIndexForDate(d00), 0);

  // 01:00 -> 丑 (index 1)
  const d01 = new Date(2026, 8, 13, 1, 0);
  assert.equal(getZodiacIndexForDate(d01), 1);

  // 02:30 -> 丑 (index 1)
  const d02 = new Date(2026, 8, 13, 2, 30);
  assert.equal(getZodiacIndexForDate(d02), 1);

  // 06:15 -> 卯 (index 3)
  const d06 = new Date(2026, 8, 13, 6, 15);
  assert.equal(getZodiacIndexForDate(d06), 3);

  // 12:00 -> 午 (index 6, 正午)
  const d12 = new Date(2026, 8, 13, 12, 0);
  assert.equal(getZodiacIndexForDate(d12), 6);

  // 14:00 -> 未 (index 7, おやつ)
  const d14 = new Date(2026, 8, 13, 14, 0);
  assert.equal(getZodiacIndexForDate(d14), 7);

  // 22:45 -> 亥 (index 11)
  const d22 = new Date(2026, 8, 13, 22, 45);
  assert.equal(getZodiacIndexForDate(d22), 11);
});

test('generateWheelSvg builds compliant SVG markup with 12 slices and center hub', () => {
  const svg = generateWheelSvg();

  assert.match(svg, /<svg viewBox="0 0 700 700"/);
  assert.equal((svg.match(/class="wheel-slice\s/g) || []).length, 12);
  assert.equal((svg.match(/class="wheel-dir-sector/g) || []).length, 12);
  assert.equal((svg.match(/class="wheel-bell-sector/g) || []).length, 12);

  // Cardinal marks
  assert.match(svg, /北 \(N\)/);
  assert.match(svg, /南 \(S\)/);
  assert.match(svg, /東 \(E\)/);
  assert.match(svg, /西 \(W\)/);

  // Day & Night center hub
  assert.match(svg, /よる 🌙/);
  assert.match(svg, /ひる ☀️/);
  assert.match(svg, /十二支/);
});

test('knowledge/chinese-zodiacs.html meets accessibility and content standards', () => {
  const htmlPath = fileURLToPath(new URL('../knowledge/chinese-zodiacs.html', import.meta.url));
  const html = readFileSync(htmlPath, 'utf8');

  // Title and Brand
  assert.match(html, /<title>12 นักษัตรญี่ปุ่นและวงล้อเวลาโบราณ \(十二支\) \| Daijoubu JP<\/title>/);
  assert.match(html, /data-page="chinese-zodiacs"/);

  // Required UI containers
  assert.match(html, /id="zodiac-wheel-container"/);
  assert.match(html, /id="zodiac-inspector"/);
  assert.match(html, /id="zodiac-toolbar"/);
  assert.match(html, /id="zodiac-btn-now"/);
  assert.match(html, /id="zodiac-btn-sound"/);
  assert.match(html, /id="zi-dict-link"/);

  // In-depth educational sections
  assert.match(html, /กำเนิดของ 12 นักษัตร/);
  assert.match(html, /午前.*午後/);
  assert.match(html, /おやつ/);
  assert.match(html, /丑三つ時/);
  assert.match(html, /鬼門/);
  assert.match(html, /桃太郎/);
  assert.match(html, /十二支早見表/);
});
