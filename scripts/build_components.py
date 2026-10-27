#!/usr/bin/env python3
"""
build_components.py
Builds data/kanji-components.min.json from KRADFILE-u (EDRDG), the radical
decomposition of Japanese characters, filtered to the kanji in this site.

Source: https://www.edrdg.org/pub/Nihongo/kradfile-u.gz
Licence: EDRDG / CC BY-SA 4.0 (see about.html).

Usage:
  python3 scripts/build_components.py [--source /path/to/kradfile-u.gz]

This is generated reference data (not markdown-sourced). It is committed and
covered by invariant tests, but excluded from the markdown drift check.
"""

import argparse
import gzip
import hashlib
import json
import os
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MASTER = os.path.join(DATA_DIR, "kanji.min.json")
OUT = os.path.join(DATA_DIR, "kanji-components.min.json")

SOURCE_URL = "https://www.edrdg.org/pub/Nihongo/kradfile-u.gz"
# Recorded for provenance; a mismatch is a warning, not an error.
EXPECTED_SHA256 = "d99f3c950954673ef9608c1fb45d416d69bed273d75344efc40cb5829634e693"


def load_dataset():
    with open(MASTER, "r", encoding="utf-8") as f:
        return [entry["kanji"] for entry in json.load(f)]


def read_source(path):
    if path:
        with open(path, "rb") as f:
            return f.read()
    print(f"⬇️  Downloading KRADFILE-u ...")
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "daijoubu-jp-build-components"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


RAW_STROKES = {"ノ", "ハ", "マ", "ユ", "ヨ", "丶", "亅", "｜"}
CONTAINS_ICHI = {
    "五", "言", "立", "音", "王", "土", "士", "大", "正", "生", "青", "赤",
    "車", "金", "雨", "里", "黒", "豆", "西", "酉", "頁", "馬", "高", "魚",
    "鳥", "鹿", "麦", "麻", "黄", "甘", "世", "井", "元", "亘", "亜", "耳",
    "臣", "至", "舌", "血", "行", "衣", "見", "角", "谷", "豕", "貝", "走",
    "足", "身", "辛", "辰", "長", "門", "非", "面", "革", "韋", "韭", "食",
    "首", "香", "骨",
}


def clean_components(components):
    """Strip raw stroke/katakana primitives and redundant single-stroke 一."""
    filtered = [c for c in components if c not in RAW_STROKES]
    if (
        "一" in filtered
        and any(c in CONTAINS_ICHI for c in filtered)
        and len(filtered) - 1 >= 2
    ):
        filtered = [c for c in filtered if c != "一"]
    return filtered


def parse(raw):
    text = gzip.decompress(raw).decode("utf-8")
    decompositions = {}

    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        kanji, rhs = line.split(":", 1)
        kanji = kanji.strip()
        components = []
        seen = set()
        for comp in rhs.split():
            if not comp or comp == kanji or comp in seen:
                continue
            seen.add(comp)
            components.append(comp)
        if components:
            decompositions[kanji] = components
    return decompositions


def main():
    parser = argparse.ArgumentParser(description="Build data/kanji-components.min.json.")
    parser.add_argument("--source", help="Path to a local kradfile-u.gz instead of downloading.")
    parser.add_argument(
        "--clean-existing",
        action="store_true",
        help="Re-filter the existing data/kanji-components.min.json offline without re-downloading.",
    )
    args = parser.parse_args()

    dataset = load_dataset()

    if args.clean_existing:
        with open(OUT, "r", encoding="utf-8") as f:
            decompositions = json.load(f).get("entries", {})
    else:
        raw = read_source(args.source)
        digest = hashlib.sha256(raw).hexdigest()
        print(f"   sha256: {digest}")
        if digest != EXPECTED_SHA256:
            print("   ⚠️  sha256 differs from the recorded source; output may change.")
        decompositions = parse(raw)

    entries = {}
    pool = set()
    for kanji in dataset:
        raw_comps = decompositions.get(kanji)
        if not raw_comps:
            continue
        components = clean_components(raw_comps)
        if len(components) < 2:
            continue
        entries[kanji] = components
        pool.update(components)

    payload = {
        "entries": entries,
        "pool": sorted(pool),
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT) / 1024
    print(f"✅ Wrote {len(entries)} kanji decompositions ({len(pool)} components, {size_kb:.0f} KB) to {OUT}")
    if len(entries) < 5000:
        print("❌ Expected at least 5000 usable kanji.")
        sys.exit(1)


if __name__ == "__main__":
    main()
