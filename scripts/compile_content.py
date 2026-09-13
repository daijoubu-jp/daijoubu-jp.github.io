#!/usr/bin/env python3
"""
compile_content.py
Compiles human-friendly Markdown files in content/ into production JSON files in data/
with automatic Furigana-to-Ruby conversion, validation, and minification.
"""

import os
import json
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(BASE_DIR, "content")
DATA_DIR = os.path.join(BASE_DIR, "data")


def furigana_to_ruby(text):
    if not text:
        return ""
    # Matches contiguous Kanji, Latin, or Katakana immediately preceding [reading]
    pattern = r"([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF々ヶ]+|[A-Za-z0-9]+|[\u30A0-\u30FF]+)\[([^\]]+)\]"
    return re.sub(pattern, r"<ruby>\1<rt>\2</rt></ruby>", text)


def parse_key_value_line(line):
    line = line.strip()
    if line.startswith("- ") and ":" in line:
        parts = line[2:].split(":", 1)
        k = parts[0].strip().lower().replace(" ", "_")
        v = parts[1].strip()
        return k, v
    return None, None


def compile_vocabulary():
    vocab_dir = os.path.join(CONTENT_DIR, "vocabulary")
    if not os.path.exists(vocab_dir):
        print("⚠️ content/vocabulary not found, skipping.")
        return

    vocab_list = []
    
    # Process files
    for fname in sorted(os.listdir(vocab_dir)):
        if not fname.endswith(".md"):
            continue

        fpath = os.path.join(vocab_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        # Split into sections by ##
        sections = re.split(r"\n##\s+", "\n" + content)
        for sec in sections[1:]:  # Skip top header
            lines = sec.strip().split("\n")
            if not lines:
                continue

            header_match = re.match(r"^([^(\n]+)(?:\(([^)]+)\))?", lines[0].strip())
            if not header_match:
                continue

            word = header_match.group(1).strip()
            item_id = (header_match.group(2) or "").strip()
            if not item_id:
                # generate id from word or romaji
                item_id = word

            item = {
                "id": item_id,
                "word": word,
                "reading": "",
                "romaji": "",
                "category": "",
                "category_th": "",
                "series": None,
                "meaning_th": "",
                "meaning_en": "",
                "ruby_html": "",
                "literal_breakdown": [],
                "lore": "",
                "jlpt": None,
                "kanken": None,
                "tags": []
            }

            mode = "kv"
            furigana_raw = ""

            for line in lines[1:]:
                line_str = line.strip()
                if line_str == "---":
                    continue
                if line_str.startswith("### Breakdown"):
                    mode = "breakdown"
                    continue
                elif line_str.startswith("### Lore"):
                    mode = "lore"
                    continue

                if mode == "kv":
                    k, v = parse_key_value_line(line)
                    if k:
                        if k == "reading":
                            item["reading"] = v
                        elif k == "furigana":
                            furigana_raw = v
                        elif k == "romaji":
                            item["romaji"] = v
                        elif k == "category":
                            item["category"] = v
                        elif k == "category_th":
                            item["category_th"] = v
                        elif k == "series":
                            item["series"] = v if v else None
                        elif k == "meaning_th":
                            item["meaning_th"] = v
                        elif k == "meaning_en":
                            item["meaning_en"] = v
                        elif k == "jlpt":
                            try:
                                item["jlpt"] = int(v)
                            except ValueError:
                                item["jlpt"] = None
                        elif k == "kanken":
                            item["kanken"] = v
                        elif k == "tags":
                            item["tags"] = [t.strip() for t in v.split(",") if t.strip()]
                elif mode == "breakdown":
                    if line_str.startswith("- ") and ":" in line_str:
                        b_parts = line_str[2:].split(":", 1)
                        item["literal_breakdown"].append({
                            "char": b_parts[0].strip(),
                            "meaning": b_parts[1].strip()
                        })
                elif mode == "lore":
                    if line_str and not line_str.startswith("#"):
                        if item["lore"]:
                            item["lore"] += "\n" + line_str
                        else:
                            item["lore"] = line_str

            # Auto-generate ruby_html
            if furigana_raw:
                item["ruby_html"] = furigana_to_ruby(furigana_raw)
            else:
                reading = item["reading"]
                item["ruby_html"] = f"<ruby>{word}<rt>{reading}</rt></ruby>"

            vocab_list.append(item)

    out_file = os.path.join(DATA_DIR, "vocabulary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(vocab_list, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Compiled {len(vocab_list)} vocabulary items to {out_file}")


def compile_special_readings():
    fpath = os.path.join(CONTENT_DIR, "special-readings", "ateji.md")
    if not os.path.exists(fpath):
        print("⚠️ content/special-readings/ateji.md not found, skipping.")
        return

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    readings = []
    sections = re.split(r"\n##\s+", "\n" + content)
    for sec in sections[1:]:
        lines = sec.strip().split("\n")
        if not lines:
            continue

        word = lines[0].strip().split()[0]
        item = {
            "word": word,
            "reading": "",
            "kanji": [c for c in word if re.match(r"[\u4E00-\u9FFF]", c)],
            "meaning_th": "",
            "meaning_en": "",
            "category": "付表 (Ateji / 熟字訓)"
        }

        for line in lines[1:]:
            k, v = parse_key_value_line(line)
            if k == "reading":
                item["reading"] = v
            elif k == "kanji":
                item["kanji"] = [c.strip() for c in v.split(",") if c.strip()]
            elif k == "meaning_th":
                item["meaning_th"] = v
            elif k == "meaning_en":
                item["meaning_en"] = v

        readings.append(item)

    out_file = os.path.join(DATA_DIR, "fuhyo-special-readings.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(readings, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Compiled {len(readings)} special readings to {out_file}")


def compile_kanji():
    kanji_dir = os.path.join(CONTENT_DIR, "kanji")
    kanji_master_path = os.path.join(DATA_DIR, "kanji.min.json")
    if not os.path.exists(kanji_master_path):
        print("⚠️ kanji.min.json not found, skipping.")
        return

    with open(kanji_master_path, "r", encoding="utf-8") as f:
        master_list = json.load(f)

    # Index by kanji char
    kanji_map = {k["kanji"]: k for k in master_list}
    updated_count = 0
    validation_errors = []
    seen_chars = {}

    if os.path.exists(kanji_dir):
        kanji_files = []
        for root, _, files in os.walk(kanji_dir):
            for f in files:
                if f.endswith(".md") and not f.startswith("_"):
                    kanji_files.append(os.path.join(root, f))

        for fpath in sorted(kanji_files):
            rel_path = os.path.relpath(fpath, BASE_DIR)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            sections = re.split(r"\n##\s+", "\n" + content)
            for sec in sections[1:]:
                lines = sec.strip().split("\n")
                if not lines:
                    continue

                char = lines[0].strip().split()[0]
                if char in seen_chars:
                    validation_errors.append(
                        f"Duplicate entry {char!r} in {rel_path} (already defined in {seen_chars[char]})")
                else:
                    seen_chars[char] = rel_path

                if char not in kanji_map:
                    validation_errors.append(
                        f"Unknown kanji {char!r} in {rel_path} — not present in "
                        f"{os.path.relpath(kanji_master_path, BASE_DIR)}")
                    continue

                target = kanji_map[char]
                mode = "kv"
                current_ex = None
                examples = []
                origin_comps = []

                for line in lines[1:]:
                    line_str = line.strip()
                    if line_str == "---":
                        continue
                    if line_str.startswith("### Examples"):
                        mode = "examples"
                        continue
                    if line_str.startswith("### Origin Components"):
                        mode = "origin_comps"
                        continue

                    if mode == "kv":
                        k, v = parse_key_value_line(line)
                        if k == "strokes":
                            try: target["strokes"] = int(v)
                            except ValueError: pass
                        elif k == "jlpt":
                            try: target["jlpt"] = int(v)
                            except ValueError: pass
                        elif k == "kanken":
                            target["kanken"] = v
                        elif k == "radical":
                            rad_m = re.match(r"^(\d+)", v)
                            if rad_m:
                                target["radical"] = int(rad_m.group(1))
                        elif k == "onyomi":
                            target["onyomi"] = [x.strip() for x in v.split(",") if x.strip()]
                        elif k == "kunyomi":
                            target["kunyomi"] = [x.strip() for x in v.split(",") if x.strip()]
                        elif k in ("jinmei", "nanori"):
                            val_list = [x.strip() for x in v.split(",") if x.strip()]
                            target["jinmei"] = val_list
                            target["nanori"] = val_list
                        elif k == "meanings_ja":
                            target["meanings_ja"] = [x.strip() for x in v.split(",") if x.strip()]
                        elif k == "meanings_th":
                            target["meanings_th"] = [x.strip() for x in v.split(",") if x.strip()]
                        elif k == "meanings_en":
                            target["meanings_en"] = [x.strip() for x in v.split(",") if x.strip()]
                        elif k == "notes":
                            target["notes"] = v
                        elif k == "origin_type":
                            target["origin_type"] = v
                        elif k == "origin_type_th":
                            target["origin_type_th"] = v
                        elif k == "origin_description":
                            target["origin_description"] = v
                        elif k == "name_use":
                            val = v.strip().lower()
                            if val in ("yes", "true", "1"):
                                target["nameUse"] = True
                            elif val in ("no", "false", "0"):
                                target["nameUse"] = False
                            else:
                                validation_errors.append(f"{char}: invalid name_use {v!r}")
                        elif k == "traditional":
                            pass  # Traditional form is removed
                    elif mode == "examples":
                        ex_header_m = re.match(r"^-\s+\*\*([^*]+)\*\*\s*\(([^)]+)\)\s*:\s*(.*)$", line_str)
                        if ex_header_m:
                            if current_ex:
                                examples.append(current_ex)
                            current_ex = {
                                "word": ex_header_m.group(1).strip(),
                                "reading": ex_header_m.group(2).strip(),
                                "meaning_en": "",
                                "meaning_th": ex_header_m.group(3).strip(),
                                "sentence_ja": "",
                                "sentence_th": "",
                                "sentence_ruby": ""
                            }
                        elif current_ex:
                            k, v = parse_key_value_line(line)
                            if k == "ja":
                                current_ex["sentence_ja"] = v
                            elif k == "th":
                                current_ex["sentence_th"] = v
                            elif k == "ruby":
                                current_ex["sentence_ruby"] = furigana_to_ruby(v)
                    elif mode == "origin_comps":
                        comp_m = re.match(r"^-\s+\*\*([^*]+)\*\*\s*\(([^)]+)\):\s*(.*)$", line_str)
                        if comp_m:
                            origin_comps.append({
                                "part": comp_m.group(1).strip(),
                                "role": comp_m.group(2).strip(),
                                "desc": comp_m.group(3).strip(),
                            })

                if current_ex:
                    examples.append(current_ex)

                if examples:
                    target["examples"] = examples

                if origin_comps:
                    target["origin_components"] = origin_comps
                
                # Remove traditionalForm if present
                target.pop("traditionalForm", None)

                updated_count += 1

    # Remove traditionalForm across all entries
    for k in master_list:
        k.pop("traditionalForm", None)

    # Validate the merged dataset before writing anything
    for k in master_list:
        char = k.get("kanji", "?")
        if not k.get("strokes"):
            validation_errors.append(f"{char}: missing strokes")
        if not (k.get("onyomi") or k.get("kunyomi")):
            validation_errors.append(f"{char}: missing onyomi/kunyomi")
        for field in ("meanings_th", "meanings_en", "meanings_ja"):
            if not k.get(field):
                validation_errors.append(f"{char}: missing {field}")
        if not k.get("kanken"):
            validation_errors.append(f"{char}: missing kanken")
        if not k.get("radical"):
            validation_errors.append(f"{char}: missing radical")
        has_origin = any(k.get(f) for f in
                         ("origin_type", "origin_type_th", "origin_description", "origin_components"))
        if has_origin and not (k.get("origin_type") and k.get("origin_description")):
            validation_errors.append(f"{char}: incomplete origin data")

    if validation_errors:
        return validation_errors

    # Save minified kanji.min.json (GitHub Pages serves gzip itself)
    payload = json.dumps(master_list, ensure_ascii=False, separators=(",", ":"))
    with open(kanji_master_path, "w", encoding="utf-8") as f:
        f.write(payload)

    # Sync to data/kanji-levels/*.json
    levels_dir = os.path.join(DATA_DIR, "kanji-levels")
    if os.path.exists(levels_dir):
        by_level = {}
        for k in master_list:
            lvl = str(k.get("kanken") or "")
            if lvl:
                by_level.setdefault(lvl, []).append(k)
        for lvl, k_items in by_level.items():
            lvl_file = os.path.join(levels_dir, f"kanken-{lvl}.json")
            with open(lvl_file, "w", encoding="utf-8") as f:
                json.dump(k_items, f, ensure_ascii=False, indent=2)

    print(f"  ✅ Compiled and synced {updated_count} kanji to {kanji_master_path} and kanji-levels/")
    return validation_errors


SEARCH_INDEX_FIELDS = (
    "kanji", "grade", "jlpt", "kanken", "strokes", "radical", "radicalChar",
    "joyo", "onyomi", "kunyomi", "jinmei", "onyomi_hyougai", "kunyomi_hyougai",
    "origin_type",
)
SEARCH_INDEX_MEANING_LIMIT = 2


def compile_search_index():
    """Build the slim home-page index (readings + first meanings per language)."""
    master_path = os.path.join(DATA_DIR, "kanji.min.json")
    if not os.path.exists(master_path):
        print("⚠️ kanji.min.json not found, skipping search index.")
        return

    with open(master_path, "r", encoding="utf-8") as f:
        master = json.load(f)

    # Load Joyo origins classification reference if present
    joyo_origins_path = os.path.join(DATA_DIR, "joyo-origins.min.json")
    joyo_origins = {}
    if os.path.exists(joyo_origins_path):
        try:
            with open(joyo_origins_path, "r", encoding="utf-8") as jf:
                joyo_origins = json.load(jf)
        except Exception as e:
            print(f"⚠️ Warning loading joyo-origins.min.json: {e}")

    index = []
    for entry in master:
        item = {field: entry[field] for field in SEARCH_INDEX_FIELDS if field in entry}
        
        # Normalize or populate origin_type
        if "origin_type" in item:
            ot = item["origin_type"]
            for prefix in ("象形", "指事", "会意", "形声"):
                if prefix in ot:
                    item["origin_type"] = prefix
                    break
        elif entry.get("kanji") in joyo_origins:
            item["origin_type"] = joyo_origins[entry["kanji"]].get("short", "形声")

        for field in ("meanings_ja", "meanings_th", "meanings_en"):
            item[field] = (entry.get(field) or [])[:SEARCH_INDEX_MEANING_LIMIT]
        for field in ("onyomi_hyougai", "kunyomi_hyougai"):
            if field in item and not item[field]:
                del item[field]
        index.append(item)

    payload = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    out_path = os.path.join(DATA_DIR, "search-index.min.json")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(payload)

    print(f"  ✅ Compiled slim search index ({len(index)} entries) to {out_path}")


COMPOUNDS_DIR = os.path.join(CONTENT_DIR, "compounds")
COMPOUNDS_OUT = os.path.join(DATA_DIR, "compounds.min.json")
COMPOUND_HEADING_RE = re.compile(r"^(.*\S)\s+\(([^)]+)\)\s*$")
COMPOUND_SURFACE_RE = re.compile(r"^[\u3400-\u4DBF\u4E00-\u9FFF]{2,4}$")


def compile_compounds():
    """Compile content/compounds/*.md into data/compounds.min.json."""
    if not os.path.exists(COMPOUNDS_DIR):
        print("⚠️ content/compounds not found, skipping.")
        return []

    errors = []
    words = {}
    seen_paths = {}

    files = []
    for root, _, filenames in os.walk(COMPOUNDS_DIR):
        for fname in filenames:
            if fname.endswith(".md") and not fname.startswith("_"):
                files.append(os.path.join(root, fname))

    for fpath in sorted(files):
        rel_path = os.path.relpath(fpath, BASE_DIR)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        for sec in re.split(r"\n##\s+", "\n" + content)[1:]:
            lines = sec.strip().split("\n")
            if not lines:
                continue

            heading = lines[0].strip()
            match = COMPOUND_HEADING_RE.match(heading)
            if not match:
                errors.append(f"{rel_path}: bad compound heading {heading!r} (expected 'surface (reading)')")
                continue

            surface = match.group(1).strip()
            reading = match.group(2).strip()

            if not COMPOUND_SURFACE_RE.match(surface):
                errors.append(f"{rel_path}: {surface!r} is not a 2-4 character kanji compound")
                continue
            if not reading:
                errors.append(f"{rel_path}: {surface}: missing reading")

            meaning_en = ""
            meaning_th = ""
            for line in lines[1:]:
                k, v = parse_key_value_line(line)
                if k == "meaning_en":
                    meaning_en = v
                elif k == "meaning_th":
                    meaning_th = v

            if not meaning_en:
                errors.append(f"{rel_path}: {surface}: missing meaning_en")

            key = (surface, reading)
            if key in words:
                errors.append(f"{rel_path}: duplicate compound {surface} ({reading}) (also {seen_paths[key]})")
            else:
                seen_paths[key] = rel_path
                words[key] = [surface, reading, meaning_en, meaning_th]

    if errors:
        return errors

    ordered = sorted(words.values(), key=lambda w: (w[0], w[1]))
    by_kanji = {}
    for index, (surface, _reading, _en, _th) in enumerate(ordered):
        for char in dict.fromkeys(surface):
            by_kanji.setdefault(char, []).append(index)

    payload = {
        "words": ordered,
        "byKanji": {k: by_kanji[k] for k in sorted(by_kanji)},
    }
    with open(COMPOUNDS_OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    print(f"  ✅ Compiled {len(ordered)} compounds to {COMPOUNDS_OUT}")
    return []


def main():
    print("⚙️ Starting Content Compilation (Markdown -> JSON)...")
    compile_vocabulary()
    compile_special_readings()
    errors = compile_kanji() or []
    errors += compile_compounds()

    if errors:
        print(f"\n❌ Validation failed with {len(errors)} issue(s). Data files were NOT written:")
        for err in errors[:50]:
            print(f"   - {err}")
        if len(errors) > 50:
            print(f"   ... and {len(errors) - 50} more")
        sys.exit(1)

    compile_search_index()
    print("✨ Compilation complete! Production JSON files are updated.")


if __name__ == "__main__":
    main()