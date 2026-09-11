#!/usr/bin/env python3
"""
export_to_markdown.py
Converts existing JSON databases in data/ into human-friendly Markdown files (1 file per category)
in content/ for editing in VS Code or Obsidian.
"""

import os
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONTENT_DIR = os.path.join(BASE_DIR, "content")


def ruby_to_furigana_shorthand(html_str):
    if not html_str:
        return ""
    # Convert <ruby>X<rt>Y</rt></ruby> to X[Y]
    return re.sub(r"<ruby>(.*?)<rt>(.*?)</rt></ruby>", r"\1[\2]", html_str)


def export_vocabulary():
    vocab_path = os.path.join(DATA_DIR, "vocabulary.json")
    if not os.path.exists(vocab_path):
        print("⚠️ vocabulary.json not found, skipping.")
        return

    with open(vocab_path, "r", encoding="utf-8") as f:
        vocab_list = json.load(f)

    out_dir = os.path.join(CONTENT_DIR, "vocabulary")
    os.makedirs(out_dir, exist_ok=True)

    category_groups = {
        "yojijukugo.md": ("สุภาษิต 4 ตัวอักษร (四字熟語)", ["yojijukugo"]),
        "animals.md": ("สัตว์ในคันจิ (動物)", ["animals"]),
        "plants.md": ("พืช ดอกไม้ ผลไม้ (植物・花)", ["plants"]),
        "countries.md": ("ชื่อประเทศในคันจิ (国名)", ["countries"]),
        "anime.md": ("คำศัพท์และชื่อท่าจากมังงะ/อนิเมะ (アニメ)", [
            "anime-bleach", "anime-naruto", "anime-kny", "anime-jjk", "anime-other"
        ])
    }

    processed_ids = set()

    for filename, (title, cat_keys) in category_groups.items():
        items = [item for item in vocab_list if item.get("category") in cat_keys]
        if not items:
            continue

        filepath = os.path.join(out_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n")
            f.write("---\n")
            f.write(f"title: \"{title}\"\n")
            f.write(f"categories: {json.dumps(cat_keys, ensure_ascii=False)}\n")
            f.write("---\n\n")

            for item in items:
                processed_ids.add(item.get("id"))
                word = item.get("word", "")
                item_id = item.get("id", "")
                reading = item.get("reading", "")
                furigana = ruby_to_furigana_shorthand(item.get("ruby_html", ""))
                meaning_th = item.get("meaning_th", "")
                meaning_en = item.get("meaning_en", "")
                category = item.get("category", "")
                category_th = item.get("category_th", "")
                series = item.get("series") or ""
                jlpt = item.get("jlpt")
                kanken = item.get("kanken") or ""
                tags = item.get("tags") or []
                breakdown = item.get("literal_breakdown") or []
                lore = item.get("lore") or ""

                f.write(f"## {word} ({item_id})\n")
                f.write(f"- reading: {reading}\n")
                if furigana and furigana != word:
                    f.write(f"- furigana: {furigana}\n")
                if category:
                    f.write(f"- category: {category}\n")
                if category_th:
                    f.write(f"- category_th: {category_th}\n")
                if series:
                    f.write(f"- series: {series}\n")
                if jlpt is not None:
                    f.write(f"- jlpt: {jlpt}\n")
                if kanken:
                    f.write(f"- kanken: {kanken}\n")
                if tags:
                    f.write(f"- tags: {", ".join(tags)}\n")
                if meaning_th:
                    f.write(f"- meaning_th: {meaning_th}\n")
                if meaning_en:
                    f.write(f"- meaning_en: {meaning_en}\n")

                if breakdown:
                    f.write("\n### Breakdown\n")
                    for b in breakdown:
                        f.write(f"- {b.get("char", "")}: {b.get("meaning", "")}\n")

                if lore:
                    f.write("\n### Lore\n")
                    f.write(f"{lore.strip()}\n")

                f.write("\n---\n\n")

        print(f"  ✅ Exported {len(items)} items to {filepath}")


def export_origins():
    origins_path = os.path.join(DATA_DIR, "kanji-origins.json")
    if not os.path.exists(origins_path):
        print("⚠️ kanji-origins.json not found, skipping.")
        return

    with open(origins_path, "r", encoding="utf-8") as f:
        origins_dict = json.load(f)

    out_dir = os.path.join(CONTENT_DIR, "origins")
    os.makedirs(out_dir, exist_ok=True)

    type_groups = {
        "shoukei.md": ("象形文字 - อักษรภาพเลียนรูปทรง", ["象形文字", "象形・仮借"]),
        "shiji.md": ("指事文字 - อักษรสัญลักษณ์ชี้บอก", ["指事文字"]),
        "kaii.md": ("会意文字 - อักษรผสมความหมาย", ["会意文字"]),
        "keisei.md": ("形声文字 - อักษรผสมรูปและเสียง", ["形声文字", "会意・形声"]),
    }

    for filename, (title, type_keys) in type_groups.items():
        entries = [(k, v) for k, v in origins_dict.items() if v.get("type") in type_keys]
        if not entries:
            continue

        filepath = os.path.join(out_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n")
            f.write("---\n")
            f.write(f"title: \"{title}\"\n")
            f.write("---\n\n")

            for kanji_char, data in entries:
                f.write(f"## {kanji_char}\n")
                f.write(f"- type: {data.get("type", "")}\n")
                f.write(f"- type_th: {data.get("type_th", "")}\n")
                f.write("\n### Description\n")
                f.write(f"{data.get("desc", "").strip()}\n\n")

                comps = data.get("components") or []
                if comps:
                    f.write("### Components\n")
                    for c in comps:
                        part = c.get("part", "")
                        role = c.get("role", "")
                        desc = c.get("desc", "")
                        f.write(f"- **{part}** ({role}): {desc}\n")
                    f.write("\n")

                f.write("---\n\n")

        print(f"  ✅ Exported {len(entries)} origin entries to {filepath}")


def export_special_readings():
    fuhyo_path = os.path.join(DATA_DIR, "fuhyo-special-readings.json")
    if not os.path.exists(fuhyo_path):
        print("⚠️ fuhyo-special-readings.json not found, skipping.")
        return

    with open(fuhyo_path, "r", encoding="utf-8") as f:
        readings = json.load(f)

    out_dir = os.path.join(CONTENT_DIR, "special-readings")
    os.makedirs(out_dir, exist_ok=True)

    filepath = os.path.join(out_dir, "ateji.md")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("# ตารางคำอ่านพิเศษ (付表・熟字訓・当て字)\n\n")
        f.write("อ้างอิงตามตารางประกาศอย่างเป็นทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁 常用漢字表 付表)\n\n")
        f.write("---\n\n")

        for item in readings:
            word = item.get("word", "")
            reading = item.get("reading", "")
            meaning_th = item.get("meaning_th", "")
            meaning_en = item.get("meaning_en", "")
            kanji_list = item.get("kanji") or []

            f.write(f"## {word}\n")
            f.write(f"- reading: {reading}\n")
            f.write(f"- kanji: {", ".join(kanji_list)}\n")
            f.write(f"- meaning_th: {meaning_th}\n")
            if meaning_en:
                f.write(f"- meaning_en: {meaning_en}\n")
            f.write("\n---\n\n")

    print(f"  ✅ Exported {len(readings)} special readings to {filepath}")


def write_kanji_markdown(filepath, title, kanken_level, category_name, items):
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write("---\n")
        f.write(f"kanken: \"{kanken_level}\"\n")
        if category_name:
            f.write(f"category: \"{category_name}\"\n")
        f.write(f"count: {len(items)}\n")
        f.write("---\n\n")

        for k in items:
            char = k.get("kanji", "")
            onyomi = ", ".join(k.get("onyomi") or [])
            kunyomi = ", ".join(k.get("kunyomi") or [])
            jinmei = ", ".join(k.get("jinmei") or k.get("nanori") or [])
            meanings_ja = ", ".join(k.get("meanings_ja") or [])
            meanings_th = ", ".join(k.get("meanings_th") or [])
            meanings_en = ", ".join(k.get("meanings_en") or [])
            strokes = k.get("strokes")
            jlpt = k.get("jlpt")
            kanken = k.get("kanken") or ""
            radical = k.get("radical")
            radical_char = k.get("radicalChar") or ""
            notes = k.get("notes") or ""
            examples = k.get("examples") or []

            f.write(f"## {char}\n\n")
            if onyomi:
                f.write(f"- onyomi: {onyomi}\n")
            if kunyomi:
                f.write(f"- kunyomi: {kunyomi}\n")
            if jinmei:
                f.write(f"- jinmei: {jinmei}\n")
            if meanings_ja:
                f.write(f"- meanings_ja: {meanings_ja}\n")
            if meanings_th:
                f.write(f"- meanings_th: {meanings_th}\n")
            if meanings_en:
                f.write(f"- meanings_en: {meanings_en}\n")
            if strokes:
                f.write(f"- strokes: {strokes}\n")
            if jlpt:
                f.write(f"- jlpt: {jlpt}\n")
            if kanken:
                f.write(f"- kanken: {kanken}\n")
            if radical:
                f.write(f"- radical: {radical} ({radical_char})\n")
            if notes:
                f.write(f"- notes: {notes}\n")

            if examples:
                f.write("\n### Examples\n")
                for ex in examples:
                    ex_word = ex.get("word", "")
                    ex_read = ex.get("reading", "")
                    ex_mth = ex.get("meaning_th", "")
                    s_ja = ex.get("sentence_ja", "")
                    s_th = ex.get("sentence_th", "")
                    s_ruby = ruby_to_furigana_shorthand(ex.get("sentence_ruby", ""))

                    f.write(f"- **{ex_word}** ({ex_read}) : {ex_mth}\n")
                    if s_ja:
                        f.write(f"  - ja: {s_ja}\n")
                    if s_th:
                        f.write(f"  - th: {s_th}\n")
                    if s_ruby:
                        f.write(f"  - ruby: {s_ruby}\n")

            f.write("\n---\n\n")

    print(f"  ✅ Exported {len(items)} kanji to {filepath}")


def export_kanji():
    kanji_path = os.path.join(DATA_DIR, "kanji.min.json")
    if not os.path.exists(kanji_path):
        print("⚠️ kanji.min.json not found, skipping.")
        return

    with open(kanji_path, "r", encoding="utf-8") as f:
        kanji_list = json.load(f)

    out_dir = os.path.join(CONTENT_DIR, "kanji")
    os.makedirs(out_dir, exist_ok=True)

    # 1. Export 10級 to 2級 (1 file per level)
    kanken_files = {
        "10": ("kanken-10.md", "漢検 10級 (小学校1年生修了程度 - 80 ตัว)"),
        "9": ("kanken-9.md", "漢検 9級 (小学校2年生修了程度 - 160 ตัว)"),
        "8": ("kanken-8.md", "漢検 8級 (小学校3年生修了程度 - 200 ตัว)"),
        "7": ("kanken-7.md", "漢検 7級 (小学校4年生修了程度 - 202 ตัว)"),
        "6": ("kanken-6.md", "漢検 6級 (小学校5年生修了程度 - 193 ตัว)"),
        "5": ("kanken-5.md", "漢検 5級 (小学校6年生修了程度 - 191 ตัว)"),
        "4": ("kanken-4.md", "漢検 4級 (中学校在学程度 - 313 ตัว)"),
        "3": ("kanken-3.md", "漢検 3級 (中学校卒業程度 - 284 ตัว)"),
        "jun2": ("kanken-jun2.md", "漢検 準2級 (高校在学程度 - 328 ตัว)"),
        "2": ("kanken-2.md", "漢検 2級 (高校卒業・常用漢字すべて - 185 ตัว)"),
    }

    # Clean up any old grade*.md files
    for old_f in os.listdir(out_dir):
        if old_f.startswith("grade") and old_f.endswith(".md"):
            os.remove(os.path.join(out_dir, old_f))

    for lvl_key, (filename, title) in kanken_files.items():
        items = [k for k in kanji_list if str(k.get("kanken")) == lvl_key]
        if items:
            filepath = os.path.join(out_dir, filename)
            write_kanji_markdown(filepath, title, lvl_key, None, items)

    # 2. Semantic Groups for 準1級 and 1級
    semantic_groups = [
        ("fauna", "หมวดสัตว์และสิ่งมีชีวิต (Fauna: สัตว์บก, สัตว์น้ำ, นก, แมลง)", "fauna.md", [
            142, 195, 196, 93, 94, 123, 152, 153, 187, 198, 172, 205, 213, 214
        ]),
        ("flora", "หมวดพืช แมกไม้ และการเกษตร (Flora: พืช ดอกไม้ ต้นไม้ ธัญพืช)", "flora.md", [
            140, 75, 118, 115, 119, 166
        ]),
        ("nature-elements", "หมวดธรรมชาติและธาตุ (Elements: น้ำ ไฟ ดิน หิน โลหะ สภาพอากาศ)", "nature-elements.md", [
            85, 86, 32, 46, 112, 167, 173, 72, 74, 182
        ]),
        ("human-body", "หมวดมนุษย์ ร่างกาย และสุขภาพ (Human & Body: กายวิภาค โรคภัย การแพทย์)", "human-body.md", [
            9, 38, 39, 104, 130, 188, 158, 109, 128, 181, 209, 211, 133, 134, 135
        ]),
        ("action-tools", "หมวดการกระทำ อุปกรณ์ และการเดินทาง (Actions, Tools & Movement)", "action-tools.md", [
            64, 157, 60, 156, 162, 144, 18, 62, 69, 57, 111, 159, 137, 120, 145, 70, 66
        ]),
        ("society-culture", "หมวดจิตใจ วาจา วัฒนธรรม และที่อยู่อาศัย (Mind, Speech & Culture)", "society-culture.md", [
            61, 30, 149, 40, 53, 169, 63, 184, 164, 108, 113, 194, 154, 163, 170
        ]),
    ]

    for lvl_key, folder_name, level_title in [
        ("jun1", "kanken-jun1", "漢検 準1級"),
        ("1", "kanken-1", "漢検 1級")
    ]:
        lvl_dir = os.path.join(out_dir, folder_name)
        os.makedirs(lvl_dir, exist_ok=True)
        level_items = [k for k in kanji_list if str(k.get("kanken")) == lvl_key]

        assigned_chars = set()

        for group_id, group_title, filename, radicals in semantic_groups:
            matched = [k for k in level_items if k.get("radical") in radicals]
            for k in matched:
                assigned_chars.add(k.get("kanji"))
            filepath = os.path.join(lvl_dir, filename)
            write_kanji_markdown(filepath, f"{level_title} - {group_title}", lvl_key, group_id, matched)

        # Miscellaneous / Remaining
        misc_items = [k for k in level_items if k.get("kanji") not in assigned_chars]
        if misc_items:
            filepath = os.path.join(lvl_dir, "misc.md")
            write_kanji_markdown(filepath, f"{level_title} - หมวดอักษรอื่นๆ และคันจิโบราณ (Miscellaneous & Classical)", lvl_key, "misc", misc_items)


def main():
    print("🚀 Starting Export from JSON to Markdown (1 file per category)...")
    os.makedirs(CONTENT_DIR, exist_ok=True)
    export_vocabulary()
    export_origins()
    export_special_readings()
    export_kanji()
    print("✨ Export complete! Files are ready in content/")


if __name__ == "__main__":
    main()
