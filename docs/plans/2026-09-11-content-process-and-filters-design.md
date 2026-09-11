# Content Process + Filters Redesign

- **Date:** 2026-09-11
- **Status:** Approved (design), execution deferred
- **Source TODO:** `revisions.md` → TODO section (2026-09-11)

## Goal

Turn `content/kanji/**/*.md` into the single authoring database (fold origins in, add
name-legality), fix the browse filters, and make the stroke view a responsive square.
Ship in three phases so small UI wins land before the data migrations.

## Approved decisions

1. **Phased execution** — Phase 1 (UI) → Phase 2 (origins + process docs) → Phase 3
   (人名用漢字 + grade). Each phase verified and committed separately.
2. **Origins schema** — flat fields per kanji plus an `### Origin Components` list:
   `origin_type`, `origin_type_th`, `origin_description`. Matches the existing
   key/value + section parser pattern.
3. **Content layout** — keep one file per Kanken level. Add `content/README.md` (schema
   and editing rules) and `content/kanji/_template.md`. Compiler skips `_`-prefixed files.
   Add `npm run content:watch`.
4. **人名用漢字 representation** — boolean, markdown field `name_use: yes` only; absence
   means "not name-legal". JSON gets `nameUse: true|false`.
5. **Grade recategorization** — filter group 4 is derived from Kanken:
   ป.1–ป.6 = real `grade` 1–6; มัธยมต้น = 漢検 4·3; มัธยมปลาย = 準2·2;
   อุดมศึกษาขึ้นไป = 準1·1.
6. **Stroke view** — responsive square in both the inline detail view and the modal.

## Target data flow (internal process)

```text
content/kanji/**/*.md   ← single authoring database
    (kanji fields + origin_* + name_use)
        │
        ▼  scripts/compile_content.py   (Python 3.12+)
data/kanji.min.json                  full bundle (browse/detail/worksheet)
data/search-index.min.json           slim home index
data/kanji-levels/*.json             per-Kanken split
data/vocabulary.json                 vocabulary glossary
data/fuhyo-special-readings.json     special readings
        │
        ▼  browser ES modules fetch JSON
```

`content/origins/` and `data/kanji-origins.json` are removed. `content/README.md`,
`content/kanji/_template.md`, and CI drift/validation are the guardrails.

---

## Phase 1 — Filter + stroke UI

### 1a. Kanji scope: 常用 / 表外 independent
- `browse/index.html:166-176` — rename `非常用` → `表外`, keep two checkboxes.
- `browse.js:349-370` — remove the code that unchecks the other box on change.
- `search.js` `filterKanji` — scope applies only when exactly one of `joyoOnly` /
  `nonJoyoOnly` is true; both true (or both false) = no scope restriction.
- URL stays `joyo=true` / `nonjoyo=true`; both may be present.

### 1b. Grade filter → Kanken school stages
- `browse/index.html:228-236` options: `1`–`6`, `mid`, `high`, `univ`.
- `filterKanji` matches numeric `grade` for 1–6 and `item.kanken` for stages.
- Presets `browse.js:186-205`: replace `elementary`/`secondary` with stage presets.
- Align detail badge wording in `kanji-detail.js:516-518`.

### 1c. Responsive square stroke view
- `components.css:1292` and `:1933`: `width: min(100%, 360px); height: auto;
  aspect-ratio: 1/1` (mobile keeps a smaller max).
- `browse/kanji.html:333` modal view: `min(90vw, 90vh)` while square.

## Phase 2 — Origins into content/kanji + process docs

### Markdown schema
```markdown
## 日

- onyomi: ニチ, ジツ
- ...
- origin_type: 象形文字
- origin_type_th: อักษรภาพเลียนรูปทรง
- origin_description: มีที่มาจากภาพวาดดวงอาทิตย์...
- name_use: yes

### Origin Components
- 日 (หมวดอักษรหลัก): ดวงอาทิตย์

### Examples
...
```

### Steps
1. One-off `scripts/migrate_origins_to_kanji.py` reads `content/origins/*.md`, locates
   each character's `## <char>` section in `content/kanji/**`, and appends the origin
   fields/section before `### Examples` (or at section end). Idempotent; aborts on a
   character that cannot be found. Delete the script after a successful run.
2. Remove `content/origins/`, `compile_origins()`, and `data/kanji-origins.json`.
3. `kanji-detail.js:419-502` — drop `loadOriginsData`/`originsCache`; build `origin`
   from `kanji.origin_type` / `origin_type_th` / `origin_description` /
   `origin_components`. Keep the generated fallback when no origin data exists.
4. `compile_content.py` — parse `origin_*` keys and an `### Origin Components` section
   into `origin_type`, `origin_type_th`, `origin_description`, `origin_components`
   (`{part, role, desc}`).
5. Validation: if any `origin_*` field is present, require `origin_type` and
   `origin_description`.
6. Docs: `content/README.md`, `content/kanji/_template.md`; skip `_`-prefixed files in
   the compiler walk.
7. `package.json`: `"content:watch": "python3 scripts/watch_content.py"`.

## Phase 3 — 人名用漢字 + grade

- **Authoritative source:** local `data/kanjidic2.xml.gz`. KANJIDIC2 `grade` 9/10 =
  人名用漢字, 1–8 = 常用漢字 ⇒ 2,136 + 863 = **2,999 name-legal** kanji.
- Cross-check vs `source-docs/子供の名前に使える漢字.pdf` (text extracts 2,861 unique;
  page claims 3,000) and `source-docs/jinmeiyou-additional-moj-jp.pdf`. Document the
  863-vs-864 discrepancy; KANJIDIC2 wins.
- One-off `scripts/assign_name_use.py` (KANJIDIC2-driven) adds `name_use: yes` to the
  2,999 legal entries; script deleted after a verified run.
- `compile_content.py` parses `name_use` → boolean `nameUse`.
- `kanji-detail.js` `renderMeta` — badge "คันจิสำหรับชื่อคน (人名用漢字): ใช้ได้/ใช้ไม่ได้"
  after ระดับชั้นเรียน, before หมวดอักษร.
- `browse/` — new filter checkbox "เฉพาะคันจิที่ใช้ตั้งชื่อได้".

## Optional extras

- Shared scorer: exact meaning match should outrank substring (fixes `省` beating `愛`
  for `รัก`).
- Detail grade badge wording aligned with the Phase 1 stage labels.

## Testing

- `node --test` (`tests/`): scope union, stage mapping, name-use filter. Requires
  `filterKanji` to accept injected data (`options.data`), mirroring `searchKanji`.
- Python: migration count assertions (67 origins, 2,999 name-legal), compiler
  validation, `git diff --exit-code -- data/` drift, markdownlint — all gated by CI.

## Risks / non-goals

- PDF lists are imperfect; KANJIDIC2 is authoritative. 863 vs 864 documented, not fixed.
- Origin migration touches many files; verified by compile + count + drift + a rendered
  detail page.
- Stage mapping overlaps the existing Kanken filter; accepted per the TODO.
- Not in scope: re-splitting content files, new games, SEO/PWA work.
