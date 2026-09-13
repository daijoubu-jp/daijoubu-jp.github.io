# Japan Prefectures (47都道府県) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Interactive map of Japan's 47 prefectures in `knowledge/` plus a dynamic detail page per prefecture, with markdown-sourced data per AGENTS.md flow.

**Architecture:** Build scripts generate committed JSON (`prefectures-map.json` geometry, markdown facts seeded from Wikidata + curated tables); `compile_content.py` compiles markdown → `data/prefectures.json`; two static HTML pages + page-scoped CSS/JS render it. Design: `docs/plans/2026-09-13-japan-prefectures-design.md`.

**Tech Stack:** Python 3.12 stdlib (build scripts), vanilla ES modules, node:test, existing theme CSS custom properties.

**Conventions:** All user-facing copy is Thai. No comments unless mirroring neighboring code. Conventional Commits. Never hand-edit `data/*.json` outputs.

---

### Task 0: Push pending commits

**Step 1:** `git push` — clears the revisions.md TODO ("Push to Github"). 3 commits pending (2 zodiac + design doc).

---

### Task 1: Canonical prefecture table + map build script

**Files:**
- Create: `scripts/build_prefectures_map.py`
- Generate: `data/prefectures-map.json`

This table is the single reference for all later tasks (codes, slugs, names, Thai names, readings, capitals, symbols). It is embedded verbatim in both build scripts.

```python
# code, slug, romaji, name_ja, name_th, region_ja, hira, capital, capital_hira, flower, tree, bird
PREFECTURES = [
    ("01","hokkaido","Hokkaido","北海道","ฮอกไกโด","北海道地方","ほっかいどう","札幌市","さっぽろし","ハマナス","エゾマツ","タンチョウ"),
    ("02","aomori","Aomori","青森県","อาโอโมริ","東北地方","あおもりけん","青森市","あおもりし","リンゴの花","ヒバ","スワン"),
    ("03","iwate","Iwate","岩手県","อิวาเตะ","東北地方","いわてけん","盛岡市","もりおかし","リンゴの花","ナンブアカマツ","ウグイス"),
    ("04","miyagi","Miyagi","宮城県","มิยากิ","東北地方","みやぎけん","仙台市","せんだいし","ミヤギンハギ","クロマツ","ガン"),
    ("05","akita","Akita","秋田県","อากิตะ","東北地方","あきたけん","秋田市","あきたし","フキノトウ","ニホンスギ","ヤマドリ"),
    ("06","yamagata","Yamagata","山形県","ยามากาตะ","東北地方","やまがたけん","山形市","やまがたし","ベニバナ","サクラ","オシドリ"),
    ("07","fukushima","Fukushima","福島県","ฟุกุชิมะ","東北地方","ふくしまけん","福島市","ふくしまし","ネモトシャクヤク","ケヤキ","ヒバリ"),
    ("08","ibaraki","Ibaraki","茨城県","อิบารากิ","関東地方","いばらきけん","水戸市","みとし","バラ","ウメ","ヒバリ"),
    ("09","tochigi","Tochigi","栃木県","โทจิกิ","関東地方","とちぎけん","宇都宮市","うつのみやし","ヤシオツツジ","トチノキ","オオルリ"),
    ("10","gunma","Gunma","群馬県","กุมมะ","関東地方","ぐんまけん","前橋市","まえばしし","レンゲツツジ","クロマツ","ウグイス"),
    ("11","saitama","Saitama","埼玉県","ไซตามะ","関東地方","さいたまけん","さいたま市","さいたまし","サクラソウ","ケヤキ","シラコバト"),
    ("12","chiba","Chiba","千葉県","ชิบะ","関東地方","ちばけん","千葉市","ちばし","ナノハナ","マキノキ","ホオジロ"),
    ("13","tokyo","Tokyo","東京都","โตเกียว","関東地方","とうきょうと","新宿区","しんじゅくく","ソメイヨシノ","イチョウ","カラス"),
    ("14","kanagawa","Kanagawa","神奈川県","คานากาวะ","関東地方","かながわけん","横浜市","よこはまし","ヤマユリ","ギンコウ","カモメ"),
    ("15","niigata","Niigata","新潟県","นีงาตะ","中部地方","にいがたけん","新潟市","にいがたし","チューリップ","ヤチダモ","トキ"),
    ("16","toyama","Toyama","富山県","โทยามะ","中部地方","とやまけん","富山市","とやまし","チューリップ","タテヤマスギ","ライチョウ"),
    ("17","ishikawa","Ishikawa","石川県","อิชิกาวะ","中部地方","いしかわけん","金沢市","かなざわし","クロユリ","アテ","ツグミ"),
    ("18","fukui","Fukui","福井県","ฟุกุอิ","中部地方","ふくいけん","福井市","ふくいし","スイセン","マツ","ツグミ"),
    ("19","yamanashi","Yamanashi","山梨県","ยามานาชิ","中部地方","やまなしけん","甲府市","こうふし","フジザクラ","カエデ","ウグイス"),
    ("20","nagano","Nagano","長野県","นากาโนะ","中部地方","ながのけん","長野市","ながのし","レンゲツツジ","シナノキ","コガモ"),
    ("21","gifu","Gifu","岐阜県","กิฟุ","中部地方","ぎふけん","岐阜市","ぎふし","レンゲソウ","ヒノキ","コマドリ"),
    ("22","shizuoka","Shizuoka","静岡県","ชิซุโอกะ","中部地方","しずおかけん","静岡市","しずおかし","モクレン","モクコク","カワセミ"),
    ("23","aichi","Aichi","愛知県","ไอจิ","中部地方","あいちけん","名古屋市","なごやし","カキツバタ","ハナノキ","コノハズク"),
    ("24","mie","Mie","三重県","มิเอะ","近畿地方","みえけん","津市","つし","ハナショウブ","マツ","シロチドリ"),
    ("25","shiga","Shiga","滋賀県","ชิงะ","近畿地方","しがけん","大津市","おおつし","シャクナゲ","モミジ","カイツブリ"),
    ("26","kyoto","Kyoto","京都府","เกียวโต","近畿地方","きょうとふ","京都市","きょうとし","シモツケ","スギ"?,"オオルリ"),
    ("27","osaka","Osaka","大阪府","โอซากะ","近畿地方","おおさかふ","大阪市","おおさかし","ウメ(桜?)"?,"イチョウ"?,"モズ"),
    ("28","hyogo","Hyogo","兵庫県","เฮียวโกะ","近畿地方","ひょうごけん","神戸市","こうべし","ノジギク","クスノキ","コウノトリ"),
    ("29","nara","Nara","奈良県","นาระ","近畿地方","ならけん","奈良市","ならし","ナノハナ","スギ","コマドリ"),
    ("30","wakayama","Wakayama","和歌山県","วากายามะ","近畿地方","わかやまけん","和歌山市","わかやまし","ウメ","ウバメガシ","コマドリ"),
    ("31","tottori","Tottori","鳥取県","ทตโตริ","中国地方","とっとりけん","鳥取市","とっとりし","ナシの花","ダケカンバ","オオルリ"),
    ("32","shimane","Shimane","島根県","ชิมาเนะ","中国地方","しまねけん","松江市","まつえし","シャクナゲ","マツ","ハクチョウ"),
    ("33","okayama","Okayama","岡山県","โอกายามะ","中国地方","おかやまけん","岡山市","おかやまし","モモ","マツ","シジュウカラ"),
    ("34","hiroshima","Hiroshima","広島県","ฮิโรชิมะ","中国地方","ひろしまけん","広島市","ひろしまし","モミジ","カヤ","アビ"),
    ("35","yamaguchi","Yamaguchi","山口県","ยามากุจิ","中国地方","やまぐちけん","山口市","やまぐちし","ナツツバキ","クスノキ","シメ"),
    ("36","tokushima","Tokushima","徳島県","โทกุชิมะ","四国地方","とくしまけん","徳島市","とくしまし","ハナミズキ","ヤマモモ","シラサギ"),
    ("37","kagawa","Kagawa","香川県","คากาวะ","四国地方","かがわけん","高松市","たかまつし","オリーブ","イチョウ","ホトトギス"),
    ("38","ehime","Ehime","愛媛県","เอฮิเมะ","四国地方","えひめけん","松山市","まつやまし","ミカンの花","マツ","コマドリ"),
    ("39","kochi","Kochi","高知県","โคจิ","四国地方","こうちけん","高知市","こうちし","ヤマモモ","ヤナセスギ","ヤイロチョウ"),
    ("40","fukuoka","Fukuoka","福岡県","ฟุกุโอกะ","九州・沖縄地方","ふくおかけん","福岡市","ふくおかし","ウメ","クスノキ","ウグイス"),
    ("41","saga","Saga","佐賀県","ซากะ","九州・沖縄地方","さがけん","佐賀市","さがし","カメリア","クスノキ","シロチドリ"),
    ("42","nagasaki","Nagasaki","長崎県","นางาซากิ","九州・沖縄地方","ながさきけん","長崎市","ながさきし","ツツジ","ヒノキ(ビロウ)?","オシドリ"),
    ("43","kumamoto","Kumamoto","熊本県","คุมาโมโตะ","九州・沖縄地方","くまもとけん","熊本市","くまもとし","リンドウ","ヒノキ","ヒバリ"),
    ("44","oita","Oita","大分県","โออิตะ","九州・沖縄地方","おおいたけん","大分市","おおいたし","ブンチョウカ","ブナ","メジロ"),
    ("45","miyazaki","Miyazaki","宮崎県","มิยาซากิ","九州・沖縄地方","みやざきけん","宮崎市","みやざきし","ハマユウ","ヤマザクラ","コシジロウミツバチ"?),
    ("46","kagoshima","Kagoshima","鹿児島県","คาโกชิมะ","九州・沖縄地方","かごしまけん","鹿児島市","かごしまし","ミヤマキリシマ","クスノキ","カワセミ"),
    ("47","okinawa","Okinawa","沖縄県","โอกินาวะ","九州・沖縄地方","おきなわけん","那覇市","なはし","デイゴ","リュウキュウマツ","ノグチゲラ"),
]
```

> **Data accuracy note:** entries marked with `?` above must be verified against the Japanese Wikipedia prefecture infoboxes (都道府県のシンボル一覧) during implementation — fix in the script before first run. The `flower/tree/bird` triple is stable reference data.

**Step 1: Create `scripts/build_prefectures_map.py`** (pattern: `scripts/build_components.py`).

Geometry source: `https://raw.githubusercontent.com/dataofjapan/land/master/japan.geo.json` (MIT, derived from MLIT 国土数値情報). First run includes an inspection step: print each GeoJSON feature's `properties` keys/values, then map to the canonical table by Japanese name (`name_ja`). **Fail loudly (exit 1) on any of the 47 names not matched exactly once.**

Script core:

```python
#!/usr/bin/env python3
"""Build data/prefectures-map.json: simplified SVG paths for the 47 prefectures.
Geometry: dataofjapan/land japan.geo.json (MIT; derived from MLIT 国土数値情報, CC BY 4.0).
Usage: python3 scripts/build_prefectures_map.py [--source /path/to/japan.geo.json]
"""
import argparse, json, math, os, sys, urllib.request
# ... BASE_DIR/DATA_DIR/OUT/SOURCE_URL like build_components.py
# PREFECTURES table as above (full tuples)
# NAME_TO_META built from table, keyed by name_ja

def read_source(path):  # download or local file, like build_components.py

def simplify_ring(points, tolerance):  # iterative Douglas-Peucker, pure python

def project(lon, lat):  # equirectangular: x = lon * cos(36.5°), y = -lat, scaled *1000

def ring_to_path(points, tol):  # project -> simplify -> round 2dp -> "M x,y L ... Z"

def feature_to_path(geom, tol):  # walk Polygon/MultiPolygon rings; join subpaths with " "

def main():
    raw = read_source(...)
    data = json.loads(raw)
    by_name = {}
    for feat in data["features"]:
        name = feat["properties"].get("name")  # VERIFY actual key during inspection
        meta = NAME_TO_META.get(name)
        if meta is None:
            print(f"❌ Unmatched geometry name: {name!r}"); sys.exit(1)
        path = feature_to_path(feat["geometry"], tolerance=0.02)
        by_name[name] = (meta, path)
    # all 47 present check
    # viewBox from global min/max of projected coords (recompute while projecting)
    payload = {"viewBox": "0 0 W H", "prefectures": [
        {"code": c, "slug": s, "name_ja": n, "path": p} for ... ]}
    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    # print size KB; exit 1 if > 2000 KB or count != 47
```

**Step 2: Inspect source properties.** `python3 -c "import json,urllib.request; d=json.load(urllib.request.urlopen('https://raw.githubusercontent.com/dataofjapan/land/master/japan.geo.json')); print([f['properties'] for f in d['features']][:5])"` — adapt the property key and name values (may be English "Tokyo"/"Tokyo Metropolis" or Japanese; if English names, key the table by romaji instead). Fix script before proceeding.

**Step 3: Run.** `python3 scripts/build_prefectures_map.py` → expect `✅ Wrote 47 prefecture paths (... KB)`. Spot-check size and that Hokkaido/沖縄 paths exist.

**Step 4: Visual check.** Serve locally (`python3 -m http.server 8000`) with a throwaway HTML in `/tmp/opencode` that loads `data/prefectures-map.json` and draws the paths; confirm the archipelago silhouette looks correct.

**Step 5: Commit.** `git add scripts/build_prefectures_map.py data/prefectures-map.json && git commit -m "feat(prefectures): build script and map geometry for 47 prefectures"`

---

### Task 2: Facts importer → content/prefectures/*.md

**Files:**
- Create: `scripts/build_prefecture_facts.py`
- Generate: `content/prefectures/*.md` (47 files)

Markdown schema (exact; compiled by Task 3):

```markdown
## 北海道

- code: 01
- slug: hokkaido
- name_ja: 北海道
- name_hira: ほっかいどう
- name_romaji: Hokkaido
- name_th: ฮอกไกโด
- region: 北海道地方
- capital: 札幌市
- capital_reading: さっぽろし
- population: 5224614
- population_year: 2020
- area_km2: 83424.0
- flower: ハマナス
- tree: エゾマツ
- bird: タンチョウ
- etymology: ชื่อมาจากคำว่า 「北海」 หมายถึงทะเลทางเหนือ ...

### Places

- 旭山動物園 ｜ สวนสัตว์อาซาฮิยามะ
- 富良野のラベンダー畑 ｜ ทุ่งลาเวนเดอร์ฟุราโนะ

### Products

- ジンギスカン ｜ จิงกิสกัง (หมู่ย่างเสียบ)
- じゃがいも ｜ มันฝรั่ง
```

> **Amendment (2026-09-13):** Places/Products entries use `name ｜ thai-gloss` (fullwidth ｜ U+FF5C). Plain `name` entries are tolerated (th = null). Compiles to `places`/`products` arrays of `{"name": ..., "th": ...}`.

**Step 1: Create `scripts/build_prefecture_facts.py`.**

- Embeds the same `PREFECTURES` table.
- Population/area: one SPARQL query against `https://query.wikidata.org/sparql` with `User-Agent: daijoubu-jp-build-facts`:

```sparql
SELECT ?item ?nameJa ?population ?area WHERE {
  ?item wdt:P31 wd:Q174360 .
  ?item rdfs:label ?nameJa FILTER(LANG(?nameJa) = "ja")
  OPTIONAL { ?item wdt:P1082 ?population . }
  OPTIONAL { ?item wdt:P2046 ?area . }
}
```

Match rows to the table by `nameJa` (strip trailing 都/道/府/県 handled by direct table name match). On fetch failure or missing values: keep fields empty and let validation decide (population/area may be blank until refetched — do not fabricate). Record `population_year` as the current year with a `# snapshot` note in the print output; store the fetch date in the script printout only.

- **Additive only:** if the target markdown file already exists, leave it untouched (pattern: `build_compounds.py`). Only creates missing files.
- Writes `### Places` / `### Products` sections empty; `etymology:` empty.

**Step 2: Run.** `python3 scripts/build_prefecture_facts.py` → expect 47 files created.

**Step 3: Seed quality content.** Fill `etymology` (Thai, 2–4 sentences each), 3–5 `### Places` and 3–5 `### Products` per file, in official order 01→47. Reference: kanji names in `browse/kanji.html?k=` link format for the detail page come from `name_ja` (detail page derives unique kanji automatically — no markdown change needed). Commit in batches of ~10 prefectures:
`git add content/prefectures/ && git commit -m "feat(prefectures): seed prefecture facts 01-10"`

> Verify `?`-flagged symbols from Task 1 now; correct files already written only if wrong (manual edit of markdown is authoritative).

---

### Task 3: compile_prefectures() (TDD)

**Files:**
- Modify: `scripts/compile_content.py` (add function + call in `main()` after `compile_compounds()`)
- Create: `tests/prefectures.test.mjs`
- Generate: `data/prefectures.json`

**Step 1: Write failing tests** (node:test style, pattern `tests/compounds.test.mjs`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

test('prefectures.json has exactly 47 entries in official JIS order', () => {
  const { prefectures } = JSON.parse(readFileSync(`${ROOT}data/prefectures.json`, 'utf8'));
  assert.equal(prefectures.length, 47);
  prefectures.forEach((p, i) => assert.equal(p.code, String(i + 1).padStart(2, '0')));
});

test('every prefecture has complete required fields', () => {
  const { prefectures } = JSON.parse(readFileSync(`${ROOT}data/prefectures.json`, 'utf8'));
  for (const p of prefectures) {
    for (const f of ['slug','name_ja','name_hira','name_romaji','name_th','region',
                     'capital','capital_reading','etymology','flower','tree','bird']) {
      assert.ok(p[f] && String(p[f]).length > 0, `${p.code} missing ${f}`);
    }
    assert.ok(Number.isFinite(p.population) && p.population > 0, `${p.code} bad population`);
    assert.ok(Number.isFinite(p.area_km2) && p.area_km2 > 0, `${p.code} bad area_km2`);
    assert.ok(Array.isArray(p.places) && p.places.length >= 3, `${p.code} needs >=3 places`);
    assert.ok(Array.isArray(p.products) && p.products.length >= 3, `${p.code} needs >=3 products`);
  }
});

test('slugs are unique and lowercase-ascii', () => {
  const { prefectures } = JSON.parse(readFileSync(`${ROOT}data/prefectures.json`, 'utf8'));
  const slugs = prefectures.map(p => p.slug);
  assert.equal(new Set(slugs).size, 47);
  slugs.forEach(s => assert.match(s, /^[a-z]+$/));
});

test('content markdown count matches 47', () => {
  assert.equal(readdirSync(`${ROOT}content/prefectures`).filter(f => f.endsWith('.md')).length, 47);
});
```

**Step 2: Run to verify failure.** `node --test tests/prefectures.test.mjs` → FAIL (no data/prefectures.json).

**Step 3: Implement `compile_prefectures()`** in `scripts/compile_content.py` (pattern `compile_compounds()`):

- Parse each `content/prefectures/*.md`: `## <name_ja>` heading + `- key: value` lines + `### Places`/`### Products` list items (`name ｜ thai-gloss` → `{"name","th"}`; plain `name` → `"th": null`).
- Validate: heading matches `name_ja`; code/slug present; exactly 47 files; duplicates in code or slug abort; required fields non-empty (population/area may be blank at first — allow empty until Task 2 fills them, then tighten per tests).
- Abort without writing on any error (match existing `errors` handling in `main()`).
- Write `data/prefectures.json`: `{"prefectures": [ {code, slug, name_ja, name_hira, name_romaji, name_th, region, capital, capital_reading, population, population_year, area_km2, flower, tree, bird, etymology, places: [{"name","th"}], products: [{"name","th"}]} ]}` sorted by code, compact separators, `ensure_ascii=False`.
- Call from `main()`.

**Step 4: Run.** `python3 scripts/compile_content.py` then `node --test tests/prefectures.test.mjs` → PASS.

**Step 5: Commit.** `git add scripts/compile_content.py tests/prefectures.test.mjs data/prefectures.json && git commit -m "feat(prefectures): compile prefecture markdown to data/prefectures.json"`

---

### Task 4: Map page

**Files:**
- Create: `knowledge/jp-prefectures.html` (copy head/nav/footer structure from `knowledge/chinese-zodiacs.html`; `data-page="prefectures-map"`; css link → `../assets/css/prefectures.css`)
- Create: `assets/js/prefectures-map.js`
- Create: `assets/css/prefectures.css`
- Modify: `assets/js/main.js` (route `prefectures-map`)

**JS — pure, testable exports** (pattern `chinese-zodiacs.js`: importable in node without DOM):

```js
export const REGIONS = ['北海道地方','東北地方','関東地方','中部地方','近畿地方','中国地方','四国地方','九州・沖縄地方'];
export const REGION_INDEX = Object.fromEntries(REGIONS.map((r, i) => [r, i]));

export function buildMapSvg(mapData, facts, opts = {}) {
  // <svg viewBox=... class="pref-map-svg" role="img" aria-label="แผนที่ประเทศญี่ปุ่น 47 จังหวัด">
  // per prefecture: <path d="..." class="pref-region-{i} pref-path" data-slug data-name-ja
  //                    data-name-th tabindex="0" role="link" aria-label="{name_th} ({name_ja})">
  // fill-rule="evenodd"; focusable paths; return svg string
}

export function initPrefecturesMap() { // DOM: fetch map JSON + facts, innerHTML, hover tooltip, click → jp-prefecture.html?p=slug, keyboard Enter, region legend chips filter (.pref-map-region-active), text filter input, reduced-motion respected (CSS only)
}
```

**CSS** (`assets/css/prefectures.css`, theme-safe via `color-mix(in srgb, var(--color-accent) X%, var(--color-surface))` at 8 strengths; loading page only like `games.css`):

- `.pref-map-wrap` centered card, `max-width: 920px`; `.pref-map-svg path` stroke `var(--color-surface)`, hover/`.pref-path-active` → brightened fill + slight stroke emphasis; `@media (prefers-reduced-motion: reduce)` no transitions.
- `.pref-tooltip` absolute card (kanji big `var(--font-display-jp)`, hiragana, Thai name).
- `.pref-legend` chips row (8 region colors) acting as filter; `.pref-search-filter` input.
- `.pref-list-grid` fallback list of 47 links (mobile fallback + SEO).

**HTML page sections:** hero (title: แผนที่ 47 จังหวัดญี่ปุ่น (都道府県)), map wrap, legend, filter input, region-grouped list of prefecture links.

**main.js route:**

```js
} else if (pageType === 'prefectures-map') {
  const { initPrefecturesMap } = await import('./prefectures-map.js');
  initPrefecturesMap();
}
```

**Verify:** page loads at `http://localhost:8000/knowledge/jp-prefectures.html` — map renders, hover tooltip, click navigates, legend filters, all 6 themes legible.

**Commit:** `feat(prefectures): interactive 47-prefecture map page`

---

### Task 5: Detail page

**Files:**
- Create: `knowledge/jp-prefecture.html` (`data-page="prefecture-detail"`, same base structure)
- Create: `assets/js/prefecture-detail.js`
- Modify: `assets/js/main.js` (route `prefecture-detail`)

**JS — pure exports + init** (pattern `kanji-detail.js`):

```js
export function findPrefecture(prefectures, slug) { ... }        // null-safe
export function uniqueKanji(nameJa) { ... }                      // 県/都/道/府 + dupes removed, order preserved
export function formatPopulation(n) { ... }                      // "5,224,614 คน"
export function formatArea(n) { ... }                            // "83,424 ตร.กม."
export function prefectureTitle(p) { ... }                       // "北海道 (ほっかいどう)"

export async function initPrefectureDetail() {
  // ?p=slug → not found ⇒ error card + link back to map; none ⇒ redirect to map page
  // fetch data/prefectures.json once; render:
  //   header: big name_ja (var(--font-display-jp)) + name_hira + romaji + name_th
  //   TTS buttons on name + capital (speechSynthesis ja-JP, pattern kanji-detail.js)
  //   badges: region (region color), code
  //   stats grid: capital / population (snapshot year) / area
  //   symbols cards: 花/木/鳥
  //   etymology card
  //   Places + Products lists (name + Thai gloss line when th present)
  //   dictionary bridge: uniqueKanji(name_ja) → ../browse/kanji.html?k=<char>
  //   prev/next nav by code (01↔47 wrap, hidden at ends)
  // document.title + meta description update per prefecture
}
```

**Verify:** `http://localhost:8000/knowledge/jp-prefecture.html?p=osaka` renders; `?p=nowhere` shows error card; prev/next correct at 01/47 boundaries; TTS plays; theme check.

**Commit:** `feat(prefectures): dynamic prefecture detail page`

---

### Task 6: Site integration

**Files:**
- Modify: nav in **every** HTML page (23 files; brand.test.mjs lists them) — add after the zodiacs line in the คลังความรู้ dropdown:

```html
<li><a href="../knowledge/jp-prefectures.html">แผนที่ 47 จังหวัด (都道府県)</a></li>
```

Root-level pages (`index.html`, `about.html`, root `*.html`) use `knowledge/...` (no `../`). Use `edit` with `replaceAll` — **no patch scripts** (AGENTS.md).
- Modify: `knowledge/index.html` — featured card (first position, pattern of zodiac card): icon 🗾, title `แผนที่ 47 จังหวัดญี่ปุ่น (都道府県)`, desc `สำรวจแผนที่ญี่ปุ่นแบบ Interactive ครบ 47 จังหวัด ชื่อ ที่มา ข้อมูล และสัญลักษณ์ประจำจังหวัด พร้อมลิงก์สู่คันจิในพจนานุกรม`.
- Modify: `about.html` — data sources section: MLIT 国土数値情報 (CC BY 4.0, via dataofjapan/land MIT) + Wikidata (CC0) for prefecture facts.
- Modify: `sw.js` — `CACHE_NAME` bump `v5` → `v6`.
- Modify: `tests/brand.test.mjs`? Only if it hardcodes nav item counts — check before running; `tests/nav.test.mjs` guards toggles (3/page — unchanged, still 3 dropdown toggles).

**Verify:** `npm test` (nav/brand still green), manual nav check on 3 pages (root, knowledge/, browse/).

**Commit:** `feat(prefectures): register prefectures pages in navigation and knowledge hub`

---

### Task 7: Full test suite + HTML contract tests

**Files:**
- Modify: `tests/prefectures.test.mjs` — add page contract tests (pattern `tests/games.test.mjs`):

```js
test('prefectures pages declare data-page, css link, and nav entry', () => {
  const mapHtml = readFileSync(`${ROOT}knowledge/jp-prefectures.html`, 'utf8');
  const detailHtml = readFileSync(`${ROOT}knowledge/jp-prefecture.html`, 'utf8');
  assert.match(mapHtml, /data-page="prefectures-map"/);
  assert.match(mapHtml, /prefectures\.css/);
  assert.match(mapHtml, /jp-prefecture\.html/);
  assert.match(detailHtml, /data-page="prefecture-detail"/);
  assert.match(detailHtml, /prefectures\.css/);
  assert.equal((mapHtml.match(/nav-dropdown-toggle/g) || []).length, 3);
  assert.equal((detailHtml.match(/nav-dropdown-toggle/g) || []).length, 3);
});
```

- Map JSON invariant test: `data/prefectures-map.json` has 47 paths, each `d` starts with `M` and contains `Z`, `viewBox` parses to 4 numbers.

**Verify:** `npm test` → all pass (105 + new).

**Commit:** `test(prefectures): add prefectures data, map, and page contract tests`

---

### Task 8: Final gates + revisions.md + push

**Step 1:** `python3 scripts/compile_content.py && git diff --exit-code -- data/` → no drift.
**Step 2:** `npm test` → all green. `npx markdownlint-cli2 "**/*.md"` → 0 issues (content/prefectures included).
**Step 3:** `revisions.md` — add timestamped entry at top of HAVEDONE describing the prefectures feature; remove/annotate the TODO item (move to HAVEDONE per file instructions).
**Step 4:** `git push`.

---

## Notes for executor

- Read `docs/plans/2026-09-13-japan-prefectures-design.md` for approved decisions before starting.
- `data/kanji-components.min.json` is invariant-tested but excluded from markdown drift check (AGENTS.md).
- Web fetches from build scripts need `User-Agent` headers (MLIT/Wikidata/user-agent policy).
- The 47-entry prefecture table in Task 1 is the source for both scripts — keep the two copies in sync (duplicate for zero-build simplicity; a shared module would need Python/JS interop).
