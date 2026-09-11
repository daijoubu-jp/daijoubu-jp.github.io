# Content Process + Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fold origin data into `content/kanji/**/*.md`, add 人名用漢字 name-legality, fix the browse scope/grade filters, and make the stroke view a responsive square — in three verifiable phases.

**Architecture:** Markdown stays the only authoring database. `scripts/compile_content.py` compiles it to `data/*.json`; browser ES modules fetch those JSON files. No runtime framework or site build step. `content/origins/` and `data/kanji-origins.json` are deleted.

**Tech Stack:** HTML/CSS/vanilla ES modules, Python 3.12+ (`pdftotext` for validation only), Node 20+ (`node --test`), GitHub Actions.

**Approved design:** `docs/plans/2026-09-11-content-process-and-filters-design.md`

**Execution note:** approved but execution deferred. When executing, do one task per commit, verify before each commit, do not push without asking, and do not touch `revisions.md` except to add the final HAVEDONE entry.

**Rules for every task:**

- Run the listed verification commands and read the output before claiming success.
- Conventional Commits, one logical change per commit.
- Never hand-edit generated `data/*.json`; regenerate via `python3 scripts/compile_content.py`.

---

## Phase 0 — Make `filterKanji` testable

### Task 1: Inject data into `filterKanji` and add filter tests

**Files:**

- Modify: `assets/js/search.js` (`filterKanji` signature)
- Modify: `tests/search.test.mjs`

**Step 1: Write failing tests.** Append to `tests/search.test.mjs`. Reuse a fixture with `joyo`, `grade`, `kanken`, `nameUse`:

```js
const FILTER_FIXTURE = [
  { kanji: '山', joyo: true, grade: 3, kanken: '8', nameUse: true },
  { kanji: '亜', joyo: true, grade: 8, kanken: '2', nameUse: true },
  { kanji: '刹', joyo: false, grade: null, kanken: 'jun1', nameUse: false },
];

test('filterKanji: both scope boxes checked = all kanji', async () => {
  const out = await filterKanji({ joyoOnly: true, nonJoyoOnly: true }, { data: FILTER_FIXTURE });
  assert.equal(out.length, 3);
});

test('filterKanji: one scope box checked filters', async () => {
  const out = await filterKanji({ joyoOnly: true, nonJoyoOnly: false }, { data: FILTER_FIXTURE });
  assert.deepEqual(out.map(k => k.kanji), ['山', '亜']);
});

test('filterKanji: school stage maps to Kanken levels', async () => {
  const out = await filterKanji({ grade: ['mid'] }, { data: FILTER_FIXTURE });
  assert.deepEqual(out.map(k => k.kanji), ['山']);
});
```

Import `filterKanji` at the top of the test file.

**Step 2: Run it — expect failure** (`filterKanji` ignores `options.data` and stage strings):

```bash
npm test
```

**Step 3: Implement.** Change the signature:

```js
export async function filterKanji(filters = {}, options = {}) {
  const data = options.data || await loadKanjiData();
  ...
}
```

Replace the scope block (former steps 5–6) with:

```js
// 5. Kanji scope: only restrict when exactly one box is checked
const scopeActive = Boolean(filters.joyoOnly) !== Boolean(filters.nonJoyoOnly);
if (scopeActive) {
  if (filters.joyoOnly && !item.joyo) return false;
  if (filters.nonJoyoOnly && item.joyo) return false;
}
```

Replace the grade block with:

```js
// 6. School grade / Kanken-derived stage
if (filters.grade && filters.grade.length > 0) {
  const stageKanken = { mid: ['4', '3'], high: ['jun2', '2'], univ: ['jun1', '1'] };
  const grades = filters.grade.filter(g => /^[1-6]$/.test(String(g))).map(Number);
  const stages = filters.grade.filter(g => typeof g === 'string' && stageKanken[g]);
  const matchesGrade = grades.includes(item.grade);
  const matchesStage = stages.some(s => stageKanken[s].includes(String(item.kanken)));
  if (!matchesGrade && !matchesStage) return false;
}
```

Remove the old `hasElementary` / `hasSecondary` / `hasNonJoyo` logic.

**Step 4: Run tests — expect pass:**

```bash
npm test
```

**Step 5: Commit:**

```bash
git add assets/js/search.js tests/search.test.mjs
git commit -m "test(filters): inject data into filterKanji and cover scope/stage"
```

---

## Phase 1 — Filter + stroke UI

### Task 2: Independent scope checkboxes, rename 非常用 → 表外

**Files:**

- Modify: `browse/index.html:166-176`
- Modify: `assets/js/browse.js:349-370`
- Scope filtering logic is already fixed in Task 1.

**Steps:**

- In `browse/index.html`, change the second scope label text from `非常用` to `表外` and update its count/title wording (e.g. `表外漢字 (นอกตารางโจโย)`). Keep `id="filter-joyo-only"` / `id="filter-nonjoyo-only"`.
- In `browse.js`, delete the mutual-exclusion branches so each checkbox only sets its own flag:

```js
joyoCb.addEventListener('change', () => {
  currentFilters.joyoOnly = joyoCb.checked;
  currentPage = 1;
  applyCurrentFilters();
});
nonJoyoCb.addEventListener('change', () => {
  currentFilters.nonJoyoOnly = nonJoyoCb.checked;
  currentPage = 1;
  applyCurrentFilters();
});
```

- Verify `joyo`/`nonjoyo` URL params still round-trip and both can be `true`.
- `npm test`; manual: check both boxes on `browse/index.html` → all 5,867 results.
- Commit: `feat(filters): make joyo/hyougai scope checkboxes independent`.

### Task 3: Grade filter → Kanken school stages

**Files:**

- Modify: `browse/index.html:228-236` (grade options), `:436-439` (presets)
- Modify: `assets/js/browse.js` (URL read/sync/reset/presets)
- Modify: `assets/js/kanji-detail.js:516-518` (badge wording)

**Steps:**

- Replace group 4 options with:

```html
<label class="filter-checkbox-label"><input type="checkbox" name="filter-grade" value="1"> ประถมศึกษาปีที่ 1</label>
... values 2–6 ...
<label class="filter-checkbox-label"><input type="checkbox" name="filter-grade" value="mid"> มัธยมต้น (漢検 4・3級)</label>
<label class="filter-checkbox-label"><input type="checkbox" name="filter-grade" value="high"> มัธยมปลาย (準2・2級)</label>
<label class="filter-checkbox-label"><input type="checkbox" name="filter-grade" value="univ"> อุดมศึกษาขึ้นไป (準1・1級)</label>
```

- `browse.js`: parse grade values as `Number` for 1–6 and keep strings otherwise (two places that currently special-case `nonjoyo`):

```js
const val = /^[1-6]$/.test(cb.value) ? Number(cb.value) : cb.value;
```

- Update presets in `browse.js` (`elementary` stays grade `[1,2,3,4,5,6]`; replace `secondary` with `mid` → `['mid']`, `high` → `['high']`, `univ` → `['univ']`) and the corresponding `data-preset` buttons in `browse/index.html:436-439`.
- `kanji-detail.js:516-518`: keep `ป.X` for grades 1–6; otherwise show the stage from `kanken` (`4/3 → มัธยมต้น`, `jun2/2 → มัธยมปลาย`, `jun1/1 → อุดมศึกษาขึ้นไป`, `8 → มัธยมต้น`).
- `npm test`; manual: each stage preset returns the expected counts.
- Commit: `feat(filters): recategorize school grade by Kanken stages`.

### Task 4: Responsive square stroke view

**Files:**

- Modify: `assets/css/components.css:1292-1304`, `:1933-1936`
- Modify: `browse/kanji.html:333` (modal view inline style)

**Steps:**

- Replace the fixed size on `.stroke-order-view` with:

```css
width: min(100%, 360px);
height: auto;
aspect-ratio: 1 / 1;
```

Keep the mobile override but with `width: min(100%, 260px); height: auto; aspect-ratio: 1/1;`.
- Modal `#stroke-modal-view`: set `width: min(90vw, 90vh); max-width: none; height: auto; aspect-ratio: 1/1;`.
- Manual check at 360px, 768px, and desktop widths: SVG stays centered and undistorted; modal fills the viewport while square.
- Commit: `fix(stroke): responsive 1:1 stroke view (inline + modal)`.

---

## Phase 2 — Origins into `content/kanji` + process docs

### Task 5: Migrate origins into kanji markdown

**Files:**

- Create: `scripts/migrate_origins_to_kanji.py` (deleted after a verified run)
- Modify: `content/kanji/**/*.md`
- Delete: `content/origins/`

**Step 1:** Write `scripts/migrate_origins_to_kanji.py` that:

- parses `content/origins/*.md` exactly like the old `compile_origins()` (`## <char>`, `type`, `type_th`, `### Description`, `### Components` with `- **part** (role): desc`);
- walks `content/kanji/**/*.md` and locates each `## <char>` section;
- if the section already contains `origin_type`, skips it (idempotent);
- inserts before `### Examples` (or at section end):

```markdown
- origin_type: 象形文字
- origin_type_th: อักษรภาพเลียนรูปทรง
- origin_description: <description, newlines collapsed to spaces>
```

- appends, when components exist:

```markdown
### Origin Components
- **田** (ความหมาย): ทุ่งนา
```

- collects any origin character that has no matching kanji section and exits non-zero listing them.

**Step 2:** Run `python3 scripts/migrate_origins_to_kanji.py`. Expected: `67` migrated, 0 missing.

**Step 3:** Verify:

```bash
grep -rc "origin_type:" content/kanji | awk -F: '{s+=$2} END {print s}'   # → 67
python3 scripts/compile_content.py && git diff --exit-code -- data/
```

**Step 4:** Delete `content/origins/` and the migration script.

**Step 5:** Commit: `refactor(content): fold origin data into kanji markdown`.

### Task 6: Compiler parses origins; remove origins pipeline

**Files:**

- Modify: `scripts/compile_content.py`
- Delete: `data/kanji-origins.json`
- Modify: `assets/js/kanji-detail.js:419-502`

**Steps:**

- In `compile_kanji`, add key/value cases: `origin_type`, `origin_type_th`, `origin_description`.
- Add an `### Origin Components` mode using the same component regex as `compile_origins`, collect into `origin_comps`, and after the section loop set `target["origin_components"] = origin_comps` when non-empty.
- Skip `_`-prefixed templates in the walk: `if f.endswith(".md") and not f.startswith("_")`.
- Validation: if any `origin_*` field is present, require `origin_type` and `origin_description`; otherwise append an error.
- Delete `compile_origins()` and its call in `main()`; remove `data/kanji-origins.json` from the repo.
- `kanji-detail.js`: delete `originsCache` and `loadOriginsData`; in `renderOrigin` build from the kanji object:

```js
let origin = null;
if (kanji.origin_type) {
  origin = {
    type: kanji.origin_type,
    type_th: kanji.origin_type_th || '',
    desc: kanji.origin_description || '',
    components: kanji.origin_components || [],
  };
}
if (!origin) { /* existing generated fallback */ }
```

- Verify: `python3 scripts/compile_content.py`, `git diff --exit-code -- data/`, `npm test`; serve locally and open a kanji with an origin (e.g. 日) and one without (e.g. 愛) — both render.
- Commit: `refactor(data): read origins from kanji data, drop kanji-origins.json`.

### Task 7: Content docs, template, watch script

**Files:**

- Create: `content/README.md`, `content/kanji/_template.md`
- Modify: `package.json`

**Steps:**

- `content/README.md`: instructions, the full entry schema (all fields incl. `origin_*`, `name_use`), the `### Examples` and `### Origin Components` formats, and the rule "edit markdown, never `data/`".
- `content/kanji/_template.md`: a copy-paste skeleton (no real `## <char>` heading so it never parses).
- `package.json`: add `"content:watch": "python3 scripts/watch_content.py"`.
- Verify `npm run content:watch` starts and recompiles on a touch; Ctrl+C.
- Commit: `docs(content): add authoring guide and kanji template`.

---

## Phase 3 — 人名用漢字 + grade badge

### Task 8: Assign `name_use` from KANJIDIC2

**Files:**

- Create: `scripts/assign_name_use.py` (deleted after a verified run)
- Modify: `content/kanji/**/*.md`
- Modify: `scripts/compile_content.py`

**Step 1:** Write `scripts/assign_name_use.py` that:

- streams `data/kanjidic2.xml.gz` with `xml.etree.ElementTree.iterparse`; collects literals whose `misc/grade` is `1`–`10` (joyo + jinmeiyou) into a `legal` set;
- asserts `len(legal) == 2999`;
- for each `content/kanji/**/*.md` `## <char>` section, if `char in legal` and the section has no `name_use`, inserts `- name_use: yes` with the same insertion helper as Task 5;
- prints matched/missing counts and exits non-zero if any `legal` kanji is absent from the markdown.

**Step 2:** Run it. Expected: `2999` legal, all matched (dataset contains them).

**Step 3:** Verify:

```bash
grep -rc "name_use: yes" content/kanji | awk -F: '{s+=$2} END {print s}'  # → 2999
```

**Step 4:** `compile_content.py`: parse `name_use` into `target["nameUse"] = v.strip().lower() in ("yes", "true", "1")`. Validation: reject values other than yes/no/true/false.

**Step 5:** `python3 scripts/compile_content.py`; `git diff --exit-code -- data/`; `npm test`.

**Step 6:** Delete the migration script. Commit: `feat(data): add name_use (人名用漢字) from KANJIDIC2`.

### Task 9: Detail badge + browse filter for name-legal kanji

**Files:**

- Modify: `assets/js/kanji-detail.js` (`renderMeta`)
- Modify: `browse/index.html` (scope group), `assets/js/browse.js`, `assets/js/search.js`
- Modify: `tests/search.test.mjs`

**Steps:**

- `renderMeta`: add after the ระดับชั้นเรียน item, before หมวดอักษร:

```js
const nameUseBadge = `<span class="badge badge--grade">${kanji.nameUse ? 'ใช้ได้' : 'ใช้ไม่ได้'}</span>`;
```

with label `คันจิสำหรับชื่อคน (人名用漢字)`.
- `browse/index.html`: add `<input type="checkbox" id="filter-nameuse"> เฉพาะคันจิที่ใช้ตั้งชื่อได้` to the scope group.
- `browse.js`: `currentFilters.nameUseOnly = false`; read `nameuse=true`, write it, sync the checkbox, reset it.
- `search.js` `filterKanji`: `if (filters.nameUseOnly && !item.nameUse) return false;`.
- Add a test: `filterKanji({ nameUseOnly: true }, { data: FILTER_FIXTURE })` returns only `nameUse` entries.
- `npm test`; manual: detail badge + filter.
- Commit: `feat(filters): surface 人名用漢字 name legality`.

### Task 10 (optional extras): scorer exactness + grade badge wording

**Files:**

- Modify: `assets/js/search.js` (`scoreEntry`)
- Modify: `tests/search.test.mjs`

**Steps:**

- Test first: with a fixture where one entry's exact Thai meaning is `รัก` and another only contains it, `searchKanjiIndex` must rank the exact one first.
- In `scoreEntry`, split Thai meaning matching into exact/partial mirroring English:

```js
const thExact = (item.meanings_th || []).some(m => m.toLowerCase() === q);
const thSub = (item.meanings_th || []).some(m => m.toLowerCase().includes(q));
if (thExact) score += 95;
else if (thSub) score += 60;
```

- Run `npm test`; manual check `รัก` ranks 愛 above 省.
- Commit: `fix(search): rank exact meaning matches above substrings`.

---

## Final verification

- `npm test` → all pass.
- `python3 scripts/compile_content.py && git diff --exit-code -- data/` → clean.
- `npx --yes markdownlint-cli2 "**/*.md"` → 0 issues.
- Local server smoke: home search, `browse/index.html` scope (both boxes) and each grade stage, a detail page with origin + name badge, stroke view square at mobile/desktop widths.
- `git status` → only intended files; `content/origins/` and `data/kanji-origins.json` gone.
- Add a HAVEDONE entry to `revisions.md`; do not push without explicit request.
