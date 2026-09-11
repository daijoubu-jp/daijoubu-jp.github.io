# Site Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the five highest-impact process and performance problems found in the 2026-09-11 review: untracked authoring source, dual build pipelines, duplicate ES module instances, live KanjiVG dependency, and heavy home-page data load.

**Architecture:** Zero-framework static site on GitHub Pages (`origin: daijoubu-jp/daijoubu-jp.github.io`, branch `main`). Markdown in `content/` stays the source of truth; Python scripts compile to `data/*.json`; browser JS fetches generated JSON. No runtime framework or build step is introduced for the site itself; Python + Node are dev-only tooling.

**Tech Stack:** HTML/CSS/vanilla ES modules, Python 3.14 (target 3.12+), Node 20 (`node --test`), GitHub Actions.

**User decisions (2026-09-11):**
1. Vendor all KanjiVG SVGs into the repo.
2. Track `content/` and `scripts/` in git. `revisions.md` stays ignored.
3. Slim search index for the home page autocomplete only. Header keys stay long/readable (short keys save <5KB gzip; not worth dual formats).

**Execution order note:** recommended order was 3 → 4 → 2 → 1 → 5. Tracking comes first here (Task 1) because all later tasks create/edit files under `scripts/` that should be versioned as they are written. Everything else follows the recommended risk order.

**Rules for every task:**
- Verify before commit (run the listed commands, read output).
- One task = one commit, Conventional Commits style.
- Do not push. Do not touch `revisions.md`.
- Do not hand-edit generated data; regenerate it with scripts.

---

### Task 1: Track authoring source + AGENTS.md

**Files:**
- Modify: `.gitignore`
- Create: `AGENTS.md`
- Add: `content/`, `scripts/`, `docs/`

**Step 1:** Remove the `content/` and `scripts/` lines from `.gitignore` (keep `revisions.md`, `scratch/`, `__pycache__` rules). `docs/` is not ignored, so the plan file gets tracked too.

**Step 2:** Create `AGENTS.md` with: build/test commands, data-flow rule (markdown = source of truth, never hand-edit `data/kanji.min.json` or `data/kanji-levels/*.json`), conventions, and the "no archive patch scripts" rule.

**Step 3:** Verify nothing sensitive is staged:

```bash
git status --short | head -30
git check-ignore -v content scripts revisions.md || true
```

Expected: `revisions.md` still ignored; `content/` and `scripts/` not ignored. Check `content/` for anything private before adding.

**Step 4:** Commit:

```bash
git add .gitignore AGENTS.md content scripts docs
git commit -m "chore: track authoring content and pipeline scripts"
```

---

### Task 2: Dedupe ES module URLs + promise-cache the kanji data

**Problem:** `browse.js:7-8` imports `search.js?v=...` / `storage.js?v=...`, `theme.js:8` imports `storage.js?v=...`, while `main.js` and `kanji-detail.js` import them unversioned. Different specifiers = separate module instances, duplicate downloads, separate in-memory caches. `loadKanjiData()` caches the result, not the promise, so home prefetch + daily kanji race = two 2.5MB fetches.

**Files:**
- Modify: `assets/js/browse.js:7-8`
- Modify: `assets/js/theme.js:8`
- Modify: `assets/js/search.js:7-28`
- Create: `tests/search.test.mjs`
- Create: `package.json`

**Step 1:** Write failing tests in `tests/search.test.mjs` for: (a) `createPromiseCache` returns the same promise for concurrent `get()` calls and calls the loader once; (b) on loader rejection the cache resets so a later `get()` retries; (c) `romajiToHiragana('kanji') === 'かんじ'`.

**Step 2:** Run `node --test tests/` — expect failure (`createPromiseCache` not exported).

**Step 3:** In `search.js` add an exported `createPromiseCache(loader)` helper and rewrite `loadKanjiData()` to use it; keep the existing `?v=` on the data URL; on failure log and return `[]` while resetting the cache so a later call retries.

**Step 4:** Strip `?v=...` from the three static imports. `package.json`: `{ "name": "daijoubu-jp", "private": true, "type": "module", "scripts": { "test": "node --test tests/" } }`.

**Step 5:** Run `node --test tests/` — expect all pass.

**Step 6:** Commit:

```bash
git add assets/js/search.js assets/js/browse.js assets/js/theme.js tests package.json
git commit -m "fix(js): dedupe module URLs and cache kanji data as a promise"
```

---

### Task 3: Vendor KanjiVG stroke SVGs

**Problem:** `kanji-detail.js:865` fetches every stroke animation from `raw.githubusercontent.com` (rate limits, latency, not a CDN).

**Files:**
- Create: `scripts/fetch_kanjivg.py`
- Create: `data/kanjivg/` (5,867 SVGs + `README.md` with CC BY-SA 3.0 attribution)
- Modify: `assets/js/kanji-detail.js:860-889`
- Modify: `sw.js:19-35`

**Steps:**

1. `scripts/fetch_kanjivg.py`: reads `data/kanji.min.json` for codepoints, downloads `https://codeload.github.com/KanjiVG/kanjivg/tar.gz/422b55385956` (pinned commit), extracts `kanji/<hex>.svg` into `data/kanjivg/`, writes only the codepoints present in our dataset, verifies the count, exits non-zero on mismatch. Idempotent: skips existing files unless `--force`.
2. Run it. Expected: 5,867 files. Spot-check `data/kanjivg/04e00.svg` starts with `<svg`.
3. `kanji-detail.js`: replace the raw.githubusercontent URL with `new URL(`../../data/kanjivg/${hex}.svg`, import.meta.url)`; keep the existing fallback (render the character) and message.
4. `sw.js`: in the `/data/` branch, serve `/data/kanjivg/` cache-first (immutable), keep stale-while-revalidate for other JSON. Bump `CACHE_NAME` to `kanjithai-cache-v4`.
5. Verify: `ls data/kanjivg | wc -l` → 5867; `python3 -m http.server` + open a kanji detail page (or at minimum confirm the URL resolves with `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/data/kanjivg/04e00.svg`).
6. Commit:

```bash
git add scripts/fetch_kanjivg.py data/kanjivg assets/js/kanji-detail.js sw.js
git commit -m "fix(stroke): vendor KanjiVG SVGs locally"
```

Note: this commit is large (~20-40MB). Keep it isolated.

---

### Task 4: One pipeline, validation, CI

**Problem:** `data/README.md` says edit `kanji-levels/` → `build-data.py`; `compile_content.py` does the reverse and overwrites level files. Parser skips unknown characters silently.

**Files:**
- Modify: `data/README.md` (rewrite)
- Delete: `scripts/build-data.py`
- Modify: `scripts/compile_content.py` (validation + Python 3.12 portability)
- Modify: `assets/js/search.js:23` (error message)
- Create: `.github/workflows/ci.yml`

**Steps:**

1. `data/README.md`: document real flow — edit `content/*.md`, run `python3 scripts/compile_content.py`, generated outputs are `data/kanji.min.json[.gz]`, `data/kanji-levels/*.json`, `data/vocabulary.json`, `data/kanji-origins.json`, `data/fuhyo-special-readings.json`, `data/search-index.min.json` (from Task 5). State Python 3.12+.
2. Delete `scripts/build-data.py`; update `search.js` error text to reference `scripts/compile_content.py`.
3. `compile_content.py`: add a validation summary — markdown chars missing from master, duplicate masters, entries missing strokes/meanings/readings; print counts and `sys.exit(1)` on errors. Fix the nested-quote f-string at line 148 for <3.12 safety.
4. Run `python3 scripts/compile_content.py`; confirm it exits 0 and `git diff --stat data/` is clean (idempotent).
5. `.github/workflows/ci.yml`: on push/PR — setup Python 3.12 + Node 20, run `python3 scripts/compile_content.py`, `git diff --exit-code -- data/`, `npm test`, and `npx --yes markdownlint-cli2 "**/*.md"`.
6. Commit:

```bash
git add data/README.md scripts/compile_content.py assets/js/search.js .github package.json
git rm scripts/build-data.py
git commit -m "refactor(data): markdown as single source of truth, add validation and CI"
```

---

### Task 5: Home search index

**Problem:** home loads 2.5MB (403KB gzip) of full data just to autocomplete and render the daily kanji. A slim home index with short matching scope drops that to ~257KB gzip (first-2 meanings) or ~190KB (first-1).

**Decision:** index keeps `kanji`, `codepoint` (drop), `grade`, `jlpt`, `kanken`, `strokes`, `radical`, `radicalChar`, `joyo`, `onyomi`, `kunyomi`, `jinmei`, `onyomi_hyougai`, `kunyomi_hyougai`, and the **first 2** items of `meanings_ja/th/en`. Long, readable keys. Autocomplete matching uses readings + first-2 meanings; pressing Enter still runs full search on the browse page, so matches on 3rd+ meanings remain reachable.

**Files:**
- Modify: `scripts/compile_content.py` (emit `data/search-index.min.json` + `.gz`)
- Modify: `assets/js/search.js` (add `loadSearchIndex`, `searchKanjiIndex`, `getDailyKanjiFromIndex`, `createPromiseCache` reuse)
- Modify: `assets/js/main.js` (home uses index; no `loadKanjiData` prefetch)
- Create/extend: `tests/search.test.mjs`
- Modify: `data/README.md` already covers it in Task 4.

**Steps:**

1. Tests first: `searchKanjiIndex` scores exact kanji > reading > meaning; returns max `limit`; matches a second listed meaning.
2. Add the index build to `compile_content.py` (deterministic order, `separators=(',',':')`, gzip at level 9).
3. Implement JS loader + scorer. Keep `searchKanji` and `loadKanjiData` untouched for browse/detail/worksheet.
4. `main.js`: home imports index functions; `renderAutocomplete` unchanged shape; daily kanji reads index entry (`meanings_th.slice(0,2)`).
5. Run `node --test tests/`, `python3 scripts/compile_content.py`, `git diff --exit-code -- data/`.
6. Manual check: serve locally, type a Thai and a romaji query on home, confirm autocomplete and daily card render.
7. Commit:

```bash
git add scripts/compile_content.py assets/js/search.js assets/js/main.js tests data/search-index.min.json data/search-index.min.json.gz
git commit -m "perf(home): load slim search index instead of full kanji bundle"
```

---

### Final verification

- `npm test` → pass.
- `python3 scripts/compile_content.py && git diff --exit-code -- data/` → clean.
- Local server smoke test: home search, one detail page (stroke animation), browse filters, worksheet.
- `git status` → only intended files; `revisions.md` untouched/ignored.
- Do not push without explicit request.
