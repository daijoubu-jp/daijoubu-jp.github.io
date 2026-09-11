# 🗄️ Kanji Data Structure & Maintenance

## Source of truth

The source of truth is `content/*.md`.

```text
content/*.md  →  python3 scripts/compile_content.py  →  data/*.json  →  browser
```

Do **not** hand-edit anything under `data/`. The compiler overwrites generated
files, and CI fails if they drift from the markdown source.

## Build

```bash
python3 scripts/compile_content.py   # Python 3.12+
```

The compiler is deterministic. Running it twice produces identical output.

## Generated files

| File | Purpose |
| --- | --- |
| `data/kanji.min.json` (+ `.gz`) | Full kanji bundle for browse/detail/worksheet |
| `data/kanji-levels/*.json` | Per-Kanken-level split of the full bundle |
| `data/search-index.min.json` (+ `.gz`) | Slim index for home-page search and daily kanji |
| `data/vocabulary.json` | Vocabulary / manga-anime glossary |
| `data/kanji-origins.json` | 成り立ち origin explanations |
| `data/fuhyo-special-readings.json` | 付表 special readings |

`data/kanjivg/` holds vendored stroke-order SVGs from KanjiVG (CC BY-SA 3.0).
Re-download only when needed:

```bash
python3 scripts/fetch_kanjivg.py --force
```

## Validation

`compile_content.py` reports and refuses to write when it finds:

- kanji characters in markdown that do not exist in the current master data,
- duplicate entries for the same character,
- entries missing strokes, readings, meanings, Kanken level, or radical.

Exit code is non-zero on validation failure; generated files are left untouched.

## CI

`.github/workflows/ci.yml` runs the compiler, verifies `git diff --exit-code -- data/`,
runs `npm test`, and lints markdown on every push and pull request.
