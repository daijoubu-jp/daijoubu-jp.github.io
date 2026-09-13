# Kanji Wordle (漢字・WORDLE) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an attribute-deduction Wordle where the player guesses a mystery kanji and gets per-attribute hints, in daily and practice modes.

**Architecture:** Zero-build static site. Pure deduction logic in a testable ES module, a thin DOM controller, styles in `assets/css/games.css`. No new corpus — attributes come from the existing kanji/search-index data.

**Decisions (approved 2026-09-12):**

- Mechanism: attribute-deduction grid (one kanji per guess, 6 guesses).
- Columns: จำนวนขีด, หมวดอักษร, ระดับคันเค็น, JLPT, ระดับชั้นเรียน, 常用/表外.
- Input: reuse site search (Thai / romaji / English / kana) then tap a kanji.
- Modes: daily (seeded by date, 6 guesses, streak) + practice (band chips, unlimited, fewest-guesses best).
- Daily pool: Joyo (2,136).

**Rules:** TDD for pure logic, one task per commit, verify before each commit, do not push without asking.

---

## Feedback semantics

| Column | Equal | Otherwise |
| --- | --- | --- |
| จำนวนขีด | green | ▲ / ▼ (target has more / fewer strokes) |
| หมวดอักษร | green | gray (show the guess's radical char) |
| ระดับคันเค็น | green | ▲ / ▼ by Kanken rank |
| JLPT | green | ▲ / ▼ (N5→N1); gray if either side has no JLPT |
| ระดับชั้นเรียน | green | ▲ / ▼ by stage order (ป.1–6 → ม.ต้น → ม.ปลาย → อุดมศึกษา) |
| 常用 / 表外 | green | gray |

---

## Task W1 — Search index carries radicals

**Files:**

- Modify: `scripts/compile_content.py`
- Regenerate: `data/search-index.min.json`

Add `radical` and `radicalChar` to `SEARCH_INDEX_FIELDS`, run `python3 scripts/compile_content.py`, confirm `git diff` only touches the search index, and commit:

```bash
git commit -m "data(wordle): include radical fields in the search index"
```

## Task W2 — Wordle core (TDD)

**Files:**

- Create: `assets/js/games/kanji-wordle-core.js`
- Create: `tests/kanji-wordle.test.mjs`

Pure exports:

- `COLUMNS` — id, Thai label, value/compare per entry.
- `feedback(guess, target)` → array of `{ id, state: 'correct'|'higher'|'lower'|'wrong', display }`.
- `isWin(guess, target)`.
- `dailyTarget(pool, date)` — deterministic seeded pick.
- `kankenRank`, `stageRank` helpers (explicit ordering).

Tests first: equal values are green; strokes/Kanken/JLPT/stage direction arrows; radical/joyo exact; missing JLPT is gray; win only on exact character; daily target is stable within a day and differs across days.

## Task W3 — Wordle storage

**Files:**

- Modify: `assets/js/storage.js`
- Create: `tests/wordle-storage.test.mjs`

Add a `WORDLE` key and `getWordleStats()` / `saveWordleResult({ date, won, guesses })` storing `{ currentStreak, maxStreak, played, won, distribution, lastDate, lastResult }`. Tests use the in-memory localStorage mock; cover streak increment/reset, distribution, and idempotency per date.

## Task W4 — Page, controller, routing, styles, hub

**Files:**

- Create: `games/kanji-wordle.html` (`data-page="game-kanji-wordle"`)
- Create: `assets/js/games/kanji-wordle.js`
- Modify: `assets/js/main.js`, `games/index.html`, `assets/css/games.css`, `tests/games.test.mjs`

Daily + practice screens; search input with autocomplete (via `searchKanjiIndex`, excluding prior guesses); guess grid with sticky column headers and a legend; result banner; streak/best display. Hub card becomes the fourth live game. Add `.kwl-*` styles reusing `.game-*`.

## Task W5 — Verification

`npm test`, `npx markdownlint-cli2 "**/*.md"`, `python3 scripts/compile_content.py && git diff --exit-code -- data/`, local play-through of daily and practice at 360/768/desktop, keyboard/autocomplete checks. Add a `revisions.md` HAVEDONE entry.

## Risks / open points

- Rank/order tables must be explicit and documented in the core.
- Daily uses the local date; can switch to UTC for global parity.
- Autocomplete must exclude guessed kanji and cap results.