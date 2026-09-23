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
import {
  REGIONS,
  REGION_INDEX,
  buildMapSvg,
  MIN_SCALE,
  parseViewBox,
  formatViewBox,
  zoomViewBox,
  panViewBoxY,
  fitRegionViewBox,
  buildMapControlsHtml
} from '../assets/js/prefectures-map.js';
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

/* Zoom math ---------------------------------------------------------------- */

const BASE = { x: 0, y: 0, w: 384.24, h: 395.47 };

test('parseViewBox and formatViewBox round-trip and reject malformed input', () => {
  assert.deepEqual(parseViewBox('0 0 384.24 395.47'), { x: 0, y: 0, w: 384.24, h: 395.47 });
  assert.deepEqual(parseViewBox('10,20 30,40'), { x: 10, y: 20, w: 30, h: 40 });
  assert.equal(parseViewBox('0 0 10'), null);
  assert.equal(parseViewBox('0 0 abc 10'), null);
  assert.equal(parseViewBox('0 0 -5 10'), null);
  assert.equal(formatViewBox({ x: 1.005, y: 2.999, w: 384.2399, h: 10.001 }), '1 3 384.24 10');
  const live = parseViewBox(mapData.viewBox);
  assert.ok(live, 'live prefectures-map.json viewBox must parse');
  assert.equal(formatViewBox(live), mapData.viewBox);
});

test('zoomViewBox zooms about the view center and clamps at both limits', () => {
  const zoomedIn = zoomViewBox(BASE, BASE, 0.5);
  assert.equal(zoomedIn.w, BASE.w * 0.5);
  assert.equal(zoomedIn.h, BASE.h * 0.5);
  assert.ok(Math.abs((zoomedIn.x + zoomedIn.w / 2) - BASE.w / 2) < 1e-9, 'center preserved');

  const overZoomed = zoomViewBox(BASE, BASE, 0.01);
  assert.equal(overZoomed.w, BASE.w * MIN_SCALE, 'never zooms past MIN_SCALE');

  const overZoomedOut = zoomViewBox({ x: 100, y: 100, w: BASE.w * 0.2, h: BASE.h * 0.2 }, BASE, 10);
  assert.deepEqual(overZoomedOut, { ...BASE }, 'never zooms out past the base viewBox');

  // Zooming in near a corner clamps the view fully inside the base rect.
  const corner = zoomViewBox({ x: 0, y: 0, w: BASE.w * 0.3, h: BASE.h * 0.3 }, BASE, 0.5);
  assert.ok(corner.x >= 0 && corner.y >= 0);
  assert.ok(corner.x + corner.w <= BASE.w + 1e-9);
  assert.ok(corner.y + corner.h <= BASE.h + 1e-9);
});

test('panViewBoxY shifts by a fraction of view height and clamps at the edges', () => {
  const zoomed = { x: 100, y: 100, w: BASE.w * 0.2, h: BASE.h * 0.2 };
  const down = panViewBoxY(zoomed, BASE, 0.35);
  assert.ok(down.y > zoomed.y);
  assert.equal(down.w, zoomed.w, 'pan never resizes');

  const atTop = panViewBoxY({ x: 100, y: 0, w: BASE.w * 0.2, h: BASE.h * 0.2 }, BASE, -0.35);
  assert.equal(atTop.y, 0, 'clamped at the top edge');

  const atBottom = panViewBoxY({ x: 100, y: BASE.h - BASE.h * 0.2, w: BASE.w * 0.2, h: BASE.h * 0.2 }, BASE, 0.35);
  assert.ok(Math.abs(atBottom.y + atBottom.h - BASE.h) < 1e-9, 'clamped at the bottom edge');
});

test('fitRegionViewBox contains the bounds, keeps the base aspect, and clamps', () => {
  const bounds = { x: 200, y: 40, width: 80, height: 120 };
  const view = fitRegionViewBox(bounds, BASE);
  assert.ok(view.x <= bounds.x && view.y <= bounds.y);
  assert.ok(view.x + view.w >= bounds.x + bounds.width);
  assert.ok(view.y + view.h >= bounds.y + bounds.height);
  assert.ok(Math.abs(view.w / view.h - BASE.w / BASE.h) < 1e-9, 'aspect ratio preserved');
  assert.ok(view.w <= BASE.w && view.h <= BASE.h);
  assert.ok(Math.abs((view.x + view.w / 2) - (bounds.x + bounds.width / 2)) < 1e-9 ||
            view.x === 0 || Math.abs(view.x + view.w - BASE.w) < 1e-9, 'centered unless clamped');

  const tiny = fitRegionViewBox({ x: 50, y: 50, width: 1, height: 1 }, BASE);
  assert.equal(tiny.w, BASE.w * MIN_SCALE, 'tiny regions clamp at MIN_SCALE');

  const whole = fitRegionViewBox({ x: 0, y: 0, width: BASE.w, height: BASE.h }, BASE);
  assert.deepEqual(whole, { ...BASE }, 'full-country bounds fit back to the base viewBox');
});

test('buildMapControlsHtml renders the region select and five zoom buttons', () => {
  const html = buildMapControlsHtml();
  assert.match(html, /class="pref-map-controls"/);
  assert.equal((html.match(/<option /g) || []).length, 9, 'all + 8 regions');
  assert.match(html, /<option value="">[^<]+<\/option>/, 'default option has a label');
  assert.match(html, /<option value="0">[^<]+北海道<\/option>/);
  assert.match(html, /<option value="7">[^<]+九州・沖縄<\/option>/);
  assert.ok(!html.includes('<option value="0"><span'), 'options must not nest markup');
  for (const id of ['pref-region-zoom', 'pref-zoom-in', 'pref-zoom-out', 'pref-zoom-reset', 'pref-pan-up', 'pref-pan-down']) {
    assert.ok(html.includes(`id="${id}"`), `controls missing #${id}`);
  }
  assert.equal((html.match(/<button /g) || []).length, 5);
  assert.equal((html.match(/aria-label="/g) || []).length, 7, 'group + select + 5 buttons all labelled');
});

test('prefectures.css gives all 8 regions fixed distinct colors in light and dark', () => {
  const css = readFileSync(fileURLToPath(new URL('../assets/css/prefectures.css', import.meta.url)), 'utf8');
  assert.match(css, /\.pref-map-svg path \{\s*fill: var\(--region-fill, #ffffff\);/);
  const hex = '#[0-9a-f]{6}';
  const light = [];
  for (let i = 0; i < 8; i++) {
    const m = css.match(new RegExp(`^\\.pref-region-${i} \\{ --region-fill: (${hex}); --region-tint: (${hex}); \\}`, 'm'));
    assert.ok(m, `region ${i} missing fixed light palette entry`);
    light.push(m[1].toLowerCase());
    const d = css.match(new RegExp(`^\\[data-mode="dark"\\] \\.pref-region-${i} \\{ --region-fill: (${hex}); --region-tint: (${hex}); \\}`, 'm'));
    assert.ok(d, `region ${i} missing fixed dark palette entry`);
    assert.notEqual(d[1], m[1], `region ${i} dark fill must differ from light`);
    assert.notEqual(d[2], m[2], `region ${i} dark tint must differ from light`);
  }
  assert.equal(new Set(light).size, 8, 'light palette must have 8 distinct colors');
  assert.ok(!css.includes('--region-base'), 'theme-derived --region-base tier must be gone');
  assert.ok(!new RegExp('\\.pref-region-\\d[^}]*color-mix').test(css), 'region colors must not be theme-derived');
});
