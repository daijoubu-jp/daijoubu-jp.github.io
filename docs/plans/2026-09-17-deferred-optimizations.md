# Deferred Optimizations (2026-09-17)

Outcomes of the optimization sprint that deserve their own design pass.
Each item was analyzed against current code; nothing here is speculative.

## 1. Per-kanji detail payload (biggest remaining win)

Problem: `kanji-detail.js` calls `loadKanjiData()` → the full
`data/kanji.min.json` (~2.66 MB raw / ~440 KB gz) to render one kanji.
Detail pages are the SEO landing surface, so cold visitors pay this first.

Design sketch:

- Compiler emits `data/kanji/<hex>.min.json` per entry (precedent:
  `data/kanjivg/` already ships 5,678 tiny files; CI drift check tolerates it).
- `kanji-detail.js` fetches the single record by `?k=`/`?id=` (id path needs
  hex→entry mapping: `String.fromCharCode(parseInt(hex,16))`).
- Related-kanji lookups (line ~98, ~666: components/relatives) can run on
  `search-index.min.json` if their row shape only needs char + readings +
  level badges — audit those two call sites first.
- Games/worksheet already use the slim index; `browse.js` may stay on the
  monolith (it genuinely needs examples/hyougai fields for filtering).
- Watch-out: `getKanjiByCodepoint` and the U+ display both read
  `entry.codepoint`; combine with item 2 below in the same change.

## 2. Drop derivable fields from data files

- `codepoint`: 100% derivable — verified all 5,867 entries satisfy
  `ord(kanji) === int(codepoint, 16)`. ~120 KB raw (~5%).
- `radicalChar`: derivable from `data/radicals.json` (214 rows) via
  `radical`. ~110 KB raw.
Ship once no consumer reads them (item 1 clears the `?id=` dependency).

## 3. Split the JS entry per page role

All 30 pages load one `main.js` whose static imports pull in browse,
detail, worksheet, tts… (~31 KB gz) even on pages needing only theme+nav.
`<body data-page="...">` already exists — use per-role entries or
`import()` gated on it. Low risk, medium win; do it with item 1 so the
detail page pays only what it uses.

## 4. Font Awesome full removal

23 pages now load the 105 KB cdnjs stylesheet asynchronously, which fixes
render-blocking — but the icon font is still ~130 KB + woff download for
33 distinct `fa-*` glyphs. Replace with an inline SVG sprite (~few KB) and
delete the CDN dependency; keep the async pattern until then.

## 5. romajiToHiragana ordering fragility

`search.js` applies ~100 sequential `replaceAll()` calls in map insertion
order; it works today only because multi-char keys are inserted before
their prefixes (`kya` before `ka`, `nn` before `n`). Convert to a
longest-match-first single-pass regex or trie so a future key reorder
cannot silently corrupt conversions.

## 6. Circular source of truth (watch item)

`compile_kanji()` reads `kanji.min.json`, merges `content/kanji/*.md`,
writes it back — base readings/meanings for 5,837 entries live only in the
generated file. `enrich_kanji_data.py` (KANJIDIC2 + Google Translate) is
the only full bootstrap and is not CI-tested. Options:

- run `export_to_markdown.py` for ALL fields so markdown truly is the
  source (bigger diff churn per edit), or
- add a CI job: rebuild from `kanjidic2.xml.gz` with a frozen translation
  cache (`data/translation_cache.json` already exists) and assert parity.
