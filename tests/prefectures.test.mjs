/**
 * tests/prefectures.test.mjs
 * Data-contract tests for the 47 Japan prefectures compiled from
 * content/prefectures/*.md, plus map-JSON invariants, pure-function contracts,
 * route wiring, and HTML contract tests for the two prefecture pages.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REGIONS, REGION_INDEX, buildMapSvg } from '../assets/js/prefectures-map.js';
import { findPrefecture, uniqueKanji, formatPopulation, formatArea } from '../assets/js/prefecture-detail.js';

const { prefectures } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/prefectures.json', import.meta.url)), 'utf8')
);

const mapData = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/prefectures-map.json', import.meta.url)), 'utf8')
);

test('prefectures.json has exactly 47 entries in official JIS order', () => {
  assert.equal(prefectures.length, 47);
  prefectures.forEach((p, i) => assert.equal(p.code, String(i + 1).padStart(2, '0')));
});

test('every prefecture has complete required fields', () => {
  for (const p of prefectures) {
    for (const f of ['slug','name_ja','name_hira','name_romaji','name_th','region',
                     'capital','capital_reading','etymology','flower','tree','bird']) {
      assert.ok(p[f] && String(p[f]).length > 0, `${p.code} missing ${f}`);
    }
    assert.ok(Number.isFinite(p.population) && p.population > 0, `${p.code} bad population`);
    assert.ok(Number.isFinite(p.area_km2) && p.area_km2 > 0, `${p.code} bad area_km2`);
    assert.match(p.population_year, /^\d{4}$/, `${p.code} bad population_year`);
    assert.ok(Array.isArray(p.places) && p.places.length >= 3, `${p.code} needs >=3 places`);
    assert.ok(Array.isArray(p.products) && p.products.length >= 3, `${p.code} needs >=3 products`);
  }
});

test('places and products have name and nullable thai gloss', () => {
  for (const p of prefectures) {
    for (const list of [p.places, p.products]) {
      for (const item of list) {
        assert.ok(item.name && item.name.length > 0, `${p.code}: entry missing name`);
        assert.equal('th' in item, true, `${p.code}: ${item.name} missing th key`);
      }
    }
  }
});

test('slugs are unique and lowercase-ascii', () => {
  const slugs = prefectures.map(p => p.slug);
  assert.equal(new Set(slugs).size, 47);
  slugs.forEach(s => assert.match(s, /^[a-z]+$/));
});

test('content markdown count matches 47', () => {
  const dir = fileURLToPath(new URL('../content/prefectures', import.meta.url));
  assert.equal(readdirSync(dir).filter(f => f.endsWith('.md')).length, 47);
});

test('prefectures-map.json has 47 paths with valid geometry and a numeric viewBox', () => {
  assert.equal(mapData.prefectures.length, 47);
  const numbers = String(mapData.viewBox).split(' ');
  assert.equal(numbers.length, 4, 'viewBox must have 4 components');
  numbers.forEach((n) => assert.ok(Number.isFinite(Number(n)), `viewBox component ${n} is not a number`));
  for (const p of mapData.prefectures) {
    assert.ok(p.code && p.slug && p.name_ja, `map entry missing identity fields: ${p.slug || p.code}`);
    assert.match(p.path, /^M/, `${p.slug} path must start with M`);
    assert.ok(p.path.includes('Z'), `${p.slug} path must contain Z`);
  }
});

test('REGIONS and REGION_INDEX cover every region used by the compiled data', () => {
  assert.equal(REGIONS.length, 8);
  assert.equal(REGION_INDEX['北海道地方'], 0);
  assert.equal(REGION_INDEX['九州・沖縄地方'], 7);
  for (const p of prefectures) {
    assert.ok(REGION_INDEX[p.region] !== undefined, `${p.code} unknown region: ${p.region}`);
  }
});

test('buildMapSvg renders 47 focusable region-colored paths with labels', () => {
  const svg = buildMapSvg(mapData, prefectures);

  assert.equal((svg.match(/<path /g) || []).length, 47);
  assert.match(svg, new RegExp(`<svg viewBox="${mapData.viewBox.replace(/\./g, '\\.')}"`));
  assert.match(svg, /role="group"/);
  assert.equal((svg.match(/tabindex="0"/g) || []).length, 47);
  assert.equal((svg.match(/role="link"/g) || []).length, 47);
  assert.equal((svg.match(/fill-rule="evenodd"/g) || []).length, 47);
  assert.equal((svg.match(/data-slug="/g) || []).length, 47);
  assert.match(svg, /aria-label="ฮอกไกโด \(北海道\)"/);
  assert.match(svg, /aria-label="โอกินาวะ \(沖縄県\)"/);
  assert.match(svg, /class="pref-region-0[^"]*"[^>]*data-slug="hokkaido"/);
  assert.match(svg, /class="pref-region-7[^"]*"[^>]*data-slug="kagoshima"/);
});

test('buildMapSvg escapes double quotes in slug attributes', () => {
  const fixture = {
    viewBox: '0 0 10 10',
    prefectures: [{ code: '99', slug: 'a"b', name_ja: 'テスト', path: 'M 0,0 L 1,1 Z' }]
  };
  const svg = buildMapSvg(fixture, []);
  assert.equal(svg.match(/data-slug="([^"]*)"/)[1], 'a&quot;b');
});

test('uniqueKanji strips suffixes, dedupes, and preserves order', () => {
  assert.equal(uniqueKanji('北海道'), '北海');
  assert.equal(uniqueKanji('東京都'), '東京');
  assert.equal(uniqueKanji('京都府'), '京');
  assert.equal(uniqueKanji('香川県'), '香川');
  assert.equal(uniqueKanji('京京都府'), '京');
  assert.equal(uniqueKanji(null), '');
});

test('formatPopulation and formatArea group digits and round area', () => {
  assert.equal(formatPopulation(5224614), '5,224,614 คน');
  assert.equal(formatArea(83424.0), '83,424 ตร.กม.');
  assert.equal(formatArea(2415.47), '2,415 ตร.กม.');
});

test('findPrefecture is null-safe and resolves by slug', () => {
  assert.equal(findPrefecture(prefectures, 'osaka').code, '27');
  assert.equal(findPrefecture(prefectures, 'nowhere'), null);
  assert.equal(findPrefecture(null, 'osaka'), null);
  assert.equal(findPrefecture(prefectures, null), null);
});

test('main.js wires both prefecture page routes', () => {
  const main = readFileSync(
    fileURLToPath(new URL('../assets/js/main.js', import.meta.url)),
    'utf8'
  );
  assert.match(main, /pageType === 'prefectures-map'/);
  assert.match(main, /import\('\.\/prefectures-map\.js'\)/);
  assert.match(main, /pageType === 'prefecture-detail'/);
  assert.match(main, /import\('\.\/prefecture-detail\.js'\)/);
});

test('prefectures pages declare data-page, css link, and nav entry', () => {
  const mapHtml = readFileSync(fileURLToPath(new URL('../knowledge/jp-prefectures.html', import.meta.url)), 'utf8');
  const detailHtml = readFileSync(fileURLToPath(new URL('../knowledge/jp-prefecture.html', import.meta.url)), 'utf8');
  assert.match(mapHtml, /data-page="prefectures-map"/);
  assert.match(mapHtml, /prefectures\.css/);
  assert.match(mapHtml, /jp-prefecture\.html/);
  assert.match(detailHtml, /data-page="prefecture-detail"/);
  assert.match(detailHtml, /prefectures\.css/);
  assert.match(detailHtml, /jp-prefectures\.html/);
  const navToggleCount = (html) => {
    const nav = html.match(/<nav[\s\S]*?<\/nav>/);
    assert.ok(nav, 'page missing nav block');
    return (nav[0].match(/nav-dropdown-toggle/g) || []).length;
  };
  assert.equal(navToggleCount(mapHtml), 3);
  assert.equal(navToggleCount(detailHtml), 3);
  const navEntry = /<li><a href="\.\.\/knowledge\/jp-prefectures\.html">แผนที่ 47 จังหวัด \(都道府県\)<\/a><\/li>/;
  assert.match(mapHtml, navEntry, 'map page missing prefectures nav entry at knowledge depth');
  assert.match(detailHtml, navEntry, 'detail page missing prefectures nav entry at knowledge depth');
});
