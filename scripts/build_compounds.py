#!/usr/bin/env python3
"""
build_compounds.py
Builds data/compounds.min.json from JMdict_e (EDRDG): common kanji compounds
whose characters all exist in this site's dataset.

Source: https://www.edrdg.org/pub/Nihongo/JMdict_e.gz
Licence: EDRDG / CC BY-SA 4.0 (see about.html).

Usage:
  python3 scripts/build_compounds.py [--source /path/to/JMdict_e.gz]

Output shape:
  {
    "words": [[surface, reading, gloss], ...],
    "byKanji": { "<kanji>": [wordIndex, ...], ... }
  }

Generated reference data: committed, invariant-tested, not markdown-drift-checked.
"""

import argparse
import gzip
import hashlib
import json
import os
import re
import sys
import urllib.request

from lxml import etree

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MASTER = os.path.join(DATA_DIR, "kanji.min.json")
OUT = os.path.join(DATA_DIR, "compounds.min.json")

SOURCE_URL = "https://www.edrdg.org/pub/Nihongo/JMdict_e.gz"
EXPECTED_SHA256 = "1349ec95590e48bcc1262b2f8368bf63bb0564c03c7c4c87c0e9fa266ff4acc3"

MAX_KANJI_PER_WORD = 4
MIN_KANJI_PER_WORD = 2


def load_dataset():
    with open(MASTER, "r", encoding="utf-8") as f:
        return {entry["kanji"] for entry in json.load(f)}


def read_source(path):
    if path:
        with open(path, "rb") as f:
            return f.read()
    print("⬇️  Downloading JMdict_e ...")
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "daijoubu-jp-build-compounds"})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def strip_doctype_and_entities(text):
    text = re.sub(r"<!DOCTYPE.*?\]>", "", text, count=1, flags=re.S)
    # Replace non-XML entities (JMdict defines many, e.g. &adj-na;) with nothing.
    return re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9a-fA-F]+;)[A-Za-z][\w-]*;", "", text)


def kanji_chars(surface):
    return [c for c in surface if "\u4e00" <= c <= "\u9fff" or "\u3400" <= c <= "\u4dbf"]


def build_words(raw, dataset):
    root = etree.fromstring(
        strip_doctype_and_entities(gzip.decompress(raw).decode("utf-8")).encode("utf-8"),
        etree.XMLParser(huge_tree=True, resolve_entities=False),
    )

    words = {}
    for entry in root:
        surface = reading = gloss = None
        priorities = []

        for k_ele in entry.findall("k_ele"):
            keb = k_ele.findtext("keb")
            if keb and not surface:
                surface = keb
            priorities += [p.text for p in k_ele.findall("ke_pri")]

        for r_ele in entry.findall("r_ele"):
            reb = r_ele.findtext("reb")
            if reb and not reading:
                reading = reb
            priorities += [p.text for p in r_ele.findall("re_pri")]

        if not surface or not reading or not priorities:
            continue

        senses = entry.findall("sense")
        gloss = senses[0].findtext("gloss") if senses else None
        if not gloss:
            continue

        chars = kanji_chars(surface)
        if not (MIN_KANJI_PER_WORD <= len(chars) <= MAX_KANJI_PER_WORD):
            continue
        if len(chars) != len(surface):
            continue  # keep true kanji compounds only (no mixed kana)
        if not all(c in dataset for c in chars):
            continue

        words.setdefault((surface, reading), gloss.strip())

    return words


def main():
    parser = argparse.ArgumentParser(description="Build data/compounds.min.json.")
    parser.add_argument("--source", help="Path to a local JMdict_e.gz instead of downloading.")
    args = parser.parse_args()

    raw = read_source(args.source)
    digest = hashlib.sha256(raw).hexdigest()
    print(f"   sha256: {digest}")
    if digest != EXPECTED_SHA256:
        print("   ⚠️  sha256 differs from the recorded source; output may change.")

    dataset = load_dataset()
    words = build_words(raw, dataset)

    ordered = sorted(words.items(), key=lambda kv: (kv[0][0], kv[0][1]))
    word_list = [[surface, reading, gloss] for (surface, reading), gloss in ordered]

    by_kanji = {}
    for index, (surface, _reading, _gloss) in enumerate(word_list):
        for char in set(kanji_chars(surface)):
            by_kanji.setdefault(char, []).append(index)

    payload = {"words": word_list, "byKanji": {k: by_kanji[k] for k in sorted(by_kanji)}}

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print(f"✅ Wrote {len(word_list)} compounds for {len(by_kanji)} kanji ({size_mb:.1f} MB) to {OUT}")
    if len(word_list) < 15000:
        print("❌ Expected at least 15000 compounds.")
        sys.exit(1)


if __name__ == "__main__":
    main()
