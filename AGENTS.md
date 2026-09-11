# AGENTS.md

Guidance for AI agents working in this repository.

## Project

Thai-language kanji dictionary for learners. Static site, no runtime framework, no site build step. Published from `main` branch root via GitHub Pages (`daijoubu-jp/daijoubu-jp.github.io`).

## Commands

| Task | Command |
| --- | --- |
| Compile content to site data | `python3 scripts/compile_content.py` (Python 3.12+) |
| Run JS tests | `npm test` (`node --test tests/`) |
| Lint markdown | `npx markdownlint-cli2 "**/*.md"` |
| Local preview | `python3 -m http.server 8000` then open `http://localhost:8000/` |
| Re-download stroke SVGs | `python3 scripts/fetch_kanjivg.py` (rarely needed; files are committed) |

## Data flow (single source of truth)

`content/*.md` → `scripts/compile_content.py` → `data/*.json` → browser JS fetches JSON.

- Markdown under `content/` is the source of truth. Edit it there.
- Never hand-edit generated files:
  - `data/kanji.min.json`
  - `data/kanji-levels/*.json`
  - `data/search-index.min.json`
  - `data/vocabulary.json`, `data/kanji-origins.json`, `data/fuhyo-special-readings.json`
- After editing markdown, run `python3 scripts/compile_content.py` and commit the regenerated data in the same commit.
- CI fails if generated data is out of date (`git diff --exit-code -- data/`).

## Rules

- No patch scripts. Do not write regex scripts that rewrite HTML/CSS/JS. Edit files directly. (`scripts/archive/` is legacy; do not add to it.)
- Keep the site zero-build at runtime: no frameworks, no bundlers, plain ES modules.
- KanjiVG stroke data in `data/kanjivg/` is CC BY-SA 3.0. Keep attribution in `about.html` and the page footer.
- Generated `data/kanji.min.json` must load via `assets/js/search.js`; home page uses the slim `data/search-index.min.json`.
- Run `npm test` and the compile command before claiming work complete.
- `revisions.md` is the maintainer's revision log (git-ignored). Add timestamped entries when implementing user-requested revisions.

## Conventions

- ES modules in `assets/js/`, JSDoc on exported functions.
- CSS custom properties for theming; six themes in `assets/css/themes/`.
- All user-facing copy is Thai; code, identifiers, and commits are English.
- Conventional Commits, one logical change per commit.
