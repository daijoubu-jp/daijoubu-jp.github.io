# Design: Japan Prefectures (47都道府県) Knowledge Section

Date: 2026-09-13
Status: Approved

## Goal

Add the first item of the `knowledge/` expansion from `revisions.md`: an interactive map
of Japan's 47 prefectures (都道府県) with a dynamic detail page per prefecture.
Districts (市区郡) are explicitly deferred until after prefectures ship.

## Decisions (user-approved)

| Topic | Decision |
| --- | --- |
| Page structure | Dynamic detail page (1 HTML + query param), not 47 static files |
| Map geometry | MLIT 国土数値情報 GeoJSON → build script → committed path data |
| Content depth | Rich (name, region, capital, population/area, symbols, etymology, places, products) |
| Fact source | Wikidata (verifiable facts) + curated etymology/copy, written to markdown |

## Files

New:

- `knowledge/jp-prefectures.html` — interactive map page (`data-page="prefectures-map"`)
- `knowledge/jp-prefecture.html` — dynamic detail page (`data-page="prefecture-detail"`), prefecture chosen via `?p=<slug>`
- `assets/js/prefectures-map.js` — map rendering, hover/tap behavior, region legend/filter
- `assets/js/prefecture-detail.js` — detail rendering from `data/prefectures.json`
- `assets/css/prefectures.css` — page-scoped styles (pattern: `games.css`), loaded only on the two pages
- `content/prefectures/*.md` — 47 markdown files, single source of truth
  - schema: `name_ja`, `name_hira`, `name_romaji`, `name_th`, `code` (JIS X 0401),
    `region`, `capital`, `capital_reading`, `population` (+ `population_year`),
    `area_km2`, `flower`, `tree`, `bird`, `etymology` (Thai copy), `### Places`, `### Products`
- `scripts/build_prefectures_map.py` — downloads MLIT NLD prefecture GeoJSON, projects to
  SVG coordinates, simplifies, writes `data/prefectures-map.json`
- `scripts/build_prefecture_facts.py` — additive Wikidata importer that seeds/updates the
  markdown (never overwrites manual edits; pattern: `build_compounds.py`)
- `data/prefectures-map.json` — `{ code, name_ja, slug, path }[]` (+ `viewBox`)
- `data/prefectures.json` — compiled prefecture facts
- `tests/prefectures.test.mjs` — unit/contract tests

Modified:

- `scripts/compile_content.py` — new `compile_prefectures()` with validation
  (exactly 47 entries, unique codes/slugs, required fields); aborts without writing on error
- `assets/js/main.js` — route registration for both pages
- `knowledge/index.html` — featured card
- Nav dropdown "คลังความรู้" across all HTML pages
- `about.html` — attribution: MLIT 国土数値情報 (CC BY 4.0), Wikidata (CC0)
- `sw.js` — cache version bump so map/data JSON refresh

## Data flow

```text
MLIT GeoJSON ─ build_prefectures_map.py ─▶ data/prefectures-map.json (committed)
Wikidata ───── build_prefecture_facts.py ─▶ content/prefectures/*.md (seeds, additive)
content/prefectures/*.md ─ compile_content.py ─▶ data/prefectures.json
                        └▶ browser fetch on the two new pages
```

- Population/area carry a snapshot year; facts are static per release.
- The map script pins source sha256 like `build_components.py`; re-running is idempotent.
- Wikidata importer is additive only; manual Thai copy is authoritative once written.

## Map page

- Inline SVG built at runtime from `prefectures-map.json`; regions (地方) colored via
  CSS custom properties so all six themes work.
- Hover: prefecture lights up + tooltip (kanji, hiragana, Thai name).
- Click: navigate to `jp-prefecture.html?p=<slug>`. Mobile: tap navigates directly.
- Legend doubles as a region filter; a text filter jumps to a prefecture.
- `prefers-reduced-motion` disables transitions.

## Detail page

- Header: big kanji name, readings with Web Speech TTS buttons, romaji/Thai.
- Region badge + JIS code.
- Stat grid: capital (kanji + reading), population (snapshot year), area.
- Symbols cards: flower / tree / bird.
- Etymology section (name origin, Thai).
- Famous places & products lists.
- Prev/next prefecture navigation in official JIS order.
- Dictionary bridge links for the kanji in the name (pattern: game result screens).

## Testing & gates

- `tests/prefectures.test.mjs`: 47-entry completeness, unique codes/slugs, map JSON has
  47 paths + viewBox, both HTML pages' contracts (brand, nav, data-page), compile
  round-trip, detail-page slug↔markdown cross-check.
- Gates: `python3 scripts/compile_content.py` + `git diff --exit-code -- data/`
  (excluding invariant-tested `kanji-components.min.json` per AGENTS.md), `npm test`,
  markdownlint clean.

## Work order

1. Push 2 pending commits (clears revisions.md TODO).
2. Phase 1: map build script + map data + map page.
3. Phase 2: facts pipeline + markdown content + detail page.
4. Phase 3: integration (nav, index card, about, sw), tests, push.
