#!/usr/bin/env python3
"""
scripts/repair_strokes.py
-------------------------
Audits and repairs corrupted stroke counts in content/kanji/**/*.md
using authoritative stroke count data from data/kanjidic2.xml.gz and
data/kanjivg/*.svg.
"""

import gzip
import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KANJIDIC_PATH = ROOT / "data" / "kanjidic2.xml.gz"
KANJIVG_DIR = ROOT / "data" / "kanjivg"
CONTENT_DIR = ROOT / "content" / "kanji"


def load_authoritative_strokes() -> dict[str, int]:
    strokes_map: dict[str, int] = {}

    if KANJIDIC_PATH.exists():
        print(f"Loading KANJIDIC2 from {KANJIDIC_PATH}...")
        with gzip.open(KANJIDIC_PATH, "rb") as f:
            tree = ET.parse(f)
            root = tree.getroot()
            for char_elem in root.findall("character"):
                lit = char_elem.find("literal")
                if lit is None or not lit.text:
                    continue
                kanji = lit.text.strip()
                misc = char_elem.find("misc")
                if misc is not None:
                    sc = misc.find("stroke_count")
                    if sc is not None and sc.text and sc.text.isdigit():
                        strokes_map[kanji] = int(sc.text)

        print(f"Loaded {len(strokes_map)} kanji stroke counts from KANJIDIC2.")

    # Complement with KanjiVG if any missing
    if KANJIVG_DIR.exists():
        svg_files = list(KANJIVG_DIR.glob("*.svg"))
        print(f"Auditing with {len(svg_files)} KanjiVG SVGs...")
        for svg_path in svg_files:
            stem = svg_path.stem
            try:
                cp = int(stem, 16)
                char = chr(cp)
            except ValueError:
                continue

            if char not in strokes_map:
                try:
                    content = svg_path.read_text(encoding="utf-8")
                    m = re.findall(r'<path\s+[^>]*id="kvg:[0-9a-fA-F]+-s(\d+)"', content)
                    if m:
                        strokes_map[char] = max(int(s) for s in m)
                    else:
                        path_count = content.count("<path")
                        if path_count > 0:
                            strokes_map[char] = path_count
                except Exception as err:
                    print(f"Warning reading {svg_path}: {err}")

    return strokes_map


def repair_markdown_files(strokes_map: dict[str, int]) -> tuple[int, int]:
    md_files = sorted(CONTENT_DIR.glob("**/*.md"))
    total_repaired = 0
    total_checked = 0

    for md_path in md_files:
        if md_path.name == "_template.md":
            continue

        raw = md_path.read_text(encoding="utf-8")
        lines = raw.splitlines(keepends=True)
        new_lines = []
        file_repaired = 0
        current_kanji = None

        for line in lines:
            h2_m = re.match(r"^##\s+([^\s\n]+)", line)
            if h2_m:
                current_kanji = h2_m.group(1).strip()
                new_lines.append(line)
                continue

            stroke_m = re.match(r"^(-\s*strokes:\s*)(\d+)(.*)$", line)
            if stroke_m and current_kanji:
                total_checked += 1
                prefix = stroke_m.group(1)
                current_val = int(stroke_m.group(2))
                suffix = stroke_m.group(3)

                true_val = strokes_map.get(current_kanji)
                if true_val is not None and true_val != current_val:
                    new_lines.append(f"{prefix}{true_val}{suffix}\n")
                    file_repaired += 1
                    total_repaired += 1
                else:
                    new_lines.append(line)
                continue

            new_lines.append(line)

        if file_repaired > 0:
            md_path.write_text("".join(new_lines), encoding="utf-8")
            rel_path = md_path.relative_to(ROOT)
            print(f"Repaired {file_repaired} entries in {rel_path}")

    return total_checked, total_repaired


def main():
    strokes_map = load_authoritative_strokes()
    checked, repaired = repair_markdown_files(strokes_map)
    print("----------------------------------------")
    print(f"Summary: Checked {checked} kanji entries, repaired {repaired} entries.")


if __name__ == "__main__":
    main()
