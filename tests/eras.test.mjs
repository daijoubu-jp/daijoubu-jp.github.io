import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MACRO_ERAS,
  formatGengoYearJa,
  formatGengoYearTh,
  convertFromWesternYear,
  convertFromBuddhistYear,
  convertFromGengo,
  extractUniqueKanji,
} from '../assets/js/eras-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const erasData = JSON.parse(readFileSync(resolve(ROOT, 'data/eras.json'), 'utf8'));

describe('data/eras.json schema invariants', () => {
  it('contains 15 historical periods in sequential order (縄文 -> 令和)', () => {
    assert.ok(Array.isArray(erasData.periods), 'periods should be an array');
    assert.equal(erasData.periods.length, 15, 'expected 15 periods');

    const validMacros = new Set(MACRO_ERAS.filter((m) => m.id !== 'all').map((m) => m.id));
    erasData.periods.forEach((p, idx) => {
      assert.equal(p.order, idx + 1, `period ${p.slug} order should be ${idx + 1}`);
      assert.ok(p.slug && p.name_ja && p.name_hira && p.name_th, `missing name fields on ${p.slug}`);
      assert.ok(validMacros.has(p.macro_era), `invalid macro_era ${p.macro_era} on ${p.slug}`);
      assert.equal(typeof p.start_year, 'number', `start_year must be number on ${p.slug}`);
      if (p.slug === 'reiwa') {
        assert.equal(p.end_year, null, 'reiwa end_year should be null');
      } else {
        assert.equal(typeof p.end_year, 'number', `end_year must be number on ${p.slug}`);
      }
      assert.ok(p.etymology_th.length > 20, `etymology_th too short on ${p.slug}`);
      assert.ok(p.summary_th.length > 20, `summary_th too short on ${p.slug}`);
      assert.ok(p.kanji_milestone_th.length > 20, `kanji_milestone_th too short on ${p.slug}`);
      assert.ok(Array.isArray(p.highlights) && p.highlights.length >= 2, `highlights missing on ${p.slug}`);
    });
  });

  it('contains 19 landmark & modern Gengo linked to valid period slugs', () => {
    assert.ok(Array.isArray(erasData.gengo), 'gengo should be an array');
    assert.equal(erasData.gengo.length, 19, 'expected 19 gengo entries');

    const periodSlugs = new Set(erasData.periods.map((p) => p.slug));
    for (const g of erasData.gengo) {
      assert.ok(g.id && g.name_ja && g.name_hira && g.name_th, `missing name fields on gengo ${g.id}`);
      assert.ok(periodSlugs.has(g.period_slug), `gengo ${g.id} references unknown period_slug ${g.period_slug}`);
      assert.equal(typeof g.start_year, 'number');
      if (g.id === 'reiwa') {
        assert.equal(g.end_year, null);
      } else {
        assert.equal(typeof g.end_year, 'number');
        assert.ok(g.end_year >= g.start_year, `gengo ${g.id} end_year < start_year`);
      }
      assert.ok(g.source_classic, `missing source_classic on ${g.id}`);
      assert.ok(g.meaning_th.length > 15, `meaning_th too short on ${g.id}`);
      assert.equal(typeof g.is_modern, 'boolean', `is_modern must be boolean on ${g.id}`);
    }
  });
});

describe('eras-core.js pure helpers', () => {
  it('formats Gengo year 1 as 元年 and subsequent years as N年', () => {
    assert.equal(formatGengoYearJa('令和', 1), '令和元年');
    assert.equal(formatGengoYearJa('令和', 8), '令和8年');
    assert.equal(formatGengoYearJa('', 1), '');
    assert.equal(formatGengoYearJa('令和', 0), '');

    assert.equal(formatGengoYearTh('เรวะ', 1), 'ปีเรวะที่ 1 (ปีแรก / 元年)');
    assert.equal(formatGengoYearTh('เรวะ', 8), 'ปีเรวะที่ 8');
  });

  it('converts Western (CE) years including modern transition years (1912, 1926, 1989, 2019)', () => {
    const r2026 = convertFromWesternYear(2026, erasData);
    assert.equal(r2026.ceYear, 2026);
    assert.equal(r2026.beYear, 2569);
    assert.equal(r2026.gengoMatches.length, 1);
    assert.equal(r2026.gengoMatches[0].labelJa, '令和8年');

    // 1989 transition: Showa 64 + Heisei 1 (元年)
    const r1989 = convertFromWesternYear(1989, erasData);
    assert.equal(r1989.beYear, 2532);
    const labels1989 = r1989.gengoMatches.map((m) => m.labelJa);
    assert.deepEqual(labels1989, ['昭和64年', '平成元年']);

    // 2019 transition: Heisei 31 + Reiwa 1 (元年)
    const r2019 = convertFromWesternYear(2019, erasData);
    const labels2019 = r2019.gengoMatches.map((m) => m.labelJa);
    assert.deepEqual(labels2019, ['平成31年', '令和元年']);

    // Classical Gengo: 645 -> Taika 1 (大化元年)
    const r645 = convertFromWesternYear(645, erasData);
    assert.equal(r645.gengoMatches[0].labelJa, '大化元年');
    assert.ok(r645.periodMatches.some((p) => p.slug === 'asuka'));

    // Prehistoric BCE year: -500 -> Jomon
    const rBce = convertFromWesternYear(-500, erasData);
    assert.equal(rBce.ceLabelTh, '500 ปีก่อน ค.ศ.');
    assert.ok(rBce.periodMatches.some((p) => p.slug === 'jomon'));
  });

  it('converts Thai Buddhist Era (พ.ศ.) and Gengo (和暦) accurately', () => {
    const fromBe = convertFromBuddhistYear(2569, erasData);
    assert.equal(fromBe.ceYear, 2026);
    assert.equal(fromBe.gengoMatches[0].labelJa, '令和8年');

    const fromGengo = convertFromGengo('showa', 64, erasData);
    assert.equal(fromGengo.ceYear, 1989);
    assert.equal(fromGengo.beYear, 2532);

    // Clamps out-of-range era year to max length of that era
    const clamped = convertFromGengo('taika', 99, erasData);
    assert.equal(clamped.ceYear, 650); // Taika is 645-650 (6 years)
  });

  it('extracts unique CJK kanji in order of appearance', () => {
    assert.deepEqual(
      extractUniqueKanji('令和 (れいわ) — ยุคเรวะ 令'),
      ['令', '和']
    );
  });
});

describe('Eras of Japan page and route integration', () => {
  it('wires knowledge/jp-eras.html, main.js route, and knowledge/index.html hub card', () => {
    const htmlPath = resolve(ROOT, 'knowledge/jp-eras.html');
    assert.ok(existsSync(htmlPath), 'knowledge/jp-eras.html must exist');
    const html = readFileSync(htmlPath, 'utf8');
    assert.match(html, /data-page="knowledge-eras"/);
    assert.match(html, /\.\.\/assets\/css\/eras\.css/);
    assert.match(html, /\.\.\/manifest\.json/);

    const mainJs = readFileSync(resolve(ROOT, 'assets/js/main.js'), 'utf8');
    assert.match(mainJs, /pageType === 'knowledge-eras'/);
    assert.match(mainJs, /import\('\.\/eras\.js'\)/);

    const hubHtml = readFileSync(resolve(ROOT, 'knowledge/index.html'), 'utf8');
    assert.match(hubHtml, /jp-eras\.html/);
  });
});
