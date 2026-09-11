# Content Authoring Guide

Markdown under `content/` is the **only source of truth** for the site. Never edit
files in `data/` — they are generated and CI fails if they drift from the markdown.

## Workflow

```bash
python3 scripts/compile_content.py   # content/ -> data/ (Python 3.12+)
npm run content:watch                # recompile automatically on save
npm test                             # JS/data tests
```

After editing, run the compiler and commit the regenerated `data/` files in the
same commit.

## Directory layout

| Path | Contents |
| --- | --- |
| `content/kanji/*.md` | One file per Kanken level; `kanken-1/` and `kanken-jun1/` are split thematically |
| `content/vocabulary/*.md` | Vocabulary / manga-anime glossary |
| `content/special-readings/ateji.md` | 付表 special readings |

A kanji file starts with a front-matter-style block (delimited by `---`) and then
one section per character:

```markdown
# 漢検 10級 (小学校1年生修了程度 - 80 ตัว)

---

kanken: "10"
count: 80
---

## 日

- onyomi: ニチ, ジツ
- kunyomi: ひ, か
- jinmei: あき, いる, く
- meanings_ja: ひ, か
- meanings_th: วัน, พระอาทิตย์, ประเทศญี่ปุ่น
- meanings_en: day, sun, Japan, counter for days
- strokes: 4
- jlpt: 5
- kanken: 10
- radical: 72 (日)
- origin_type: 象形文字
- origin_type_th: อักษรภาพเลียนรูปทรง
- origin_description: มีที่มาจากภาพวาดดวงอาทิตย์...
- name_use: yes

### Examples

- **日本** (にほん) : ประเทศญี่ปุ่น
  - ja: 来年、日本へ桜を見に行きたいです。
  - th: ปีหน้าฉันอยากไปดูซากุระที่ประเทศญี่ปุ่น
  - ruby: 来年[らいねん]日本[にほん]へ桜[さくら]を見[み]に行[い]きたいです。
```

## Field reference

| Field | Required | Notes |
| --- | --- | --- |
| `onyomi` | one of onyomi/kunyomi | Comma-separated katakana |
| `kunyomi` | one of onyomi/kunyomi | Comma-separated; `.` marks okurigana |
| `jinmei` | no | Nanori / name readings |
| `meanings_ja` | yes | Comma-separated Japanese glosses |
| `meanings_th` | yes | Comma-separated Thai meanings |
| `meanings_en` | yes | Comma-separated English meanings |
| `strokes` | yes | Stroke count |
| `jlpt` | no | 1–5, omit when not applicable |
| `kanken` | yes | `10`…`1`, `jun1`, `jun2` |
| `radical` | yes | `radical: 72 (日)` |
| `origin_type` / `origin_type_th` | no | 成り立ち type, e.g. `象形文字` |
| `origin_description` | with origin | One-line prose |
| `name_use` | no | Write `yes` only when legal in given names; absent means no |

### Examples

Each example is a bullet with a bold word, reading, and Thai meaning, followed by
optional indented `ja` / `th` / `ruby` lines. `ruby` uses the shorthand
`漢字[かんじ]` and is converted to `<ruby>` at compile time.

### Origin Components

Optional, only when a character has meaningful components:

```markdown
### Origin Components

- **子** (音符・意符): ทารก / การเพิ่มพูน
```

## Validation

`scripts/compile_content.py` refuses to write and exits non-zero when it finds:

- a character whose section is not present in the master data,
- duplicate entries for the same character,
- missing strokes, readings, meanings, Kanken level, or radical,
- partial origin data (type/description required together).

## Conventions

- Thai for all meanings and copy; Japanese for readings; English for glosses.
- One empty line between fields and sections; files must pass `npx markdownlint-cli2`.
- Keep characters ordered as they currently are; the compiler preserves order.
