#!/usr/bin/env python3
"""
build_compounds.py
Imports common kanji compounds from JMdict_e (EDRDG) into the editable
markdown database at content/compounds/*.md.

The markdown is the source of truth for the Quick Compound game; run
`python3 scripts/compile_content.py` to rebuild data/compounds.min.json.

This importer is additive: it only creates files/entries that do not already
exist, so manual edits (including Thai meanings) are never overwritten.

Source: https://www.edrdg.org/pub/Nihongo/JMdict_e.gz
Licence: EDRDG / CC BY-SA 4.0 (see about.html).

Usage:
  python3 scripts/build_compounds.py [--source /path/to/JMdict_e.gz]
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
COMPOUNDS_DIR = os.path.join(BASE_DIR, "content", "compounds")

SOURCE_URL = "https://www.edrdg.org/pub/Nihongo/JMdict_e.gz"
EXPECTED_SHA256 = "1349ec95590e48bcc1262b2f8368bf63bb0564c03c7c4c87c0e9fa266ff4acc3"

MIN_KANJI_PER_WORD = 2
MAX_KANJI_PER_WORD = 4

HEADING_RE = re.compile(r"^##\s+(.*\S)\s+\(([^)]+)\)\s*$")

# Gojuuon buckets for grouping files by the first character's reading.
KANA_BUCKETS = {
    "a": "あいうえお",
    "ka": "かきくけこがぎぐげご",
    "sa": "さしすせそざじずぜぞ",
    "ta": "たちつてとだぢづでど",
    "na": "なにぬねの",
    "ha": "はひふへほばびぶべぼぱぴぷぺぽ",
    "ma": "まみむめも",
    "ya": "やゆよ",
    "ra": "らりるれろ",
    "wa": "わを",
    "n": "ん",
}
BUCKET_ORDER = ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n", "other"]
SMALL_KANA = "ゃゅょ"


def load_master():
    with open(MASTER, "r", encoding="utf-8") as f:
        return {entry["kanji"]: entry for entry in json.load(f)}


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
    return re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9a-fA-F]+;)[A-Za-z][\w-]*;", "", text)


def kanji_chars(surface):
    return [c for c in surface if "\u4e00" <= c <= "\u9fff" or "\u3400" <= c <= "\u4dbf"]


def jmdict_compounds(raw, dataset):
    root = etree.fromstring(
        strip_doctype_and_entities(gzip.decompress(raw).decode("utf-8")).encode("utf-8"),
        etree.XMLParser(huge_tree=True, resolve_entities=False),
    )
    found = {}
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
            continue
        if not all(c in dataset for c in chars):
            continue

        found.setdefault((surface, reading), gloss.strip())
    return found


def to_hiragana(text):
    out = []
    for ch in text:
        code = ord(ch)
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def first_reading_bucket(char, master):
    entry = master.get(char, {})
    readings = (entry.get("onyomi") or []) + (entry.get("kunyomi") or [])
    if not readings:
        return "other"
    kana = to_hiragana(readings[0].split(".")[0].split("（")[0])
    if not kana:
        return "other"
    mora = kana[0]
    if len(kana) > 1 and (kana[1] in SMALL_KANA or kana[1] == "ー"):
        mora += kana[1]
    for bucket, chars in KANA_BUCKETS.items():
        if mora[0] in chars:
            return bucket
    return "other"


def existing_keys():
    keys = set()
    if not os.path.isdir(COMPOUNDS_DIR):
        return keys
    for root, _, files in os.walk(COMPOUNDS_DIR):
        for fname in files:
            if not fname.endswith(".md"):
                continue
            with open(os.path.join(root, fname), "r", encoding="utf-8") as f:
                for line in f:
                    m = HEADING_RE.match(line.strip())
                    if m:
                        keys.add((m.group(1).strip(), m.group(2).strip()))
    return keys


def append_entries(bucket, entries):
    os.makedirs(COMPOUNDS_DIR, exist_ok=True)
    path = os.path.join(COMPOUNDS_DIR, f"{bucket}.md")

    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# Kanji Compounds — {bucket}\n\n")

    with open(path, "a", encoding="utf-8") as f:
        for surface, reading, gloss in entries:
            f.write(f"## {surface} ({reading})\n\n")
            f.write(f"- meaning_en: {gloss}\n")
            f.write("- meaning_th:\n\n")
            f.write("---\n\n")

    # Normalize spacing so the file stays markdownlint-clean.
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    text = re.sub(r"\n{3,}", "\n\n", text).rstrip("\n") + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    parser = argparse.ArgumentParser(description="Import JMdict compounds into content/compounds/.")
    parser.add_argument("--source", help="Path to a local JMdict_e.gz instead of downloading.")
    args = parser.parse_args()

    raw = read_source(args.source)
    digest = hashlib.sha256(raw).hexdigest()
    print(f"   sha256: {digest}")
    if digest != EXPECTED_SHA256:
        print("   ⚠️  sha256 differs from the recorded source; output may change.")

    master = load_master()
    dataset = set(master)
    compounds = jmdict_compounds(raw, dataset)
    keys = existing_keys()

    buckets = {}
    for (surface, reading), gloss in compounds.items():
        if (surface, reading) in keys:
            continue
        bucket = first_reading_bucket(surface[0], master)
        buckets.setdefault(bucket, []).append((surface, reading, gloss))

    added = 0
    for bucket in BUCKET_ORDER:
        entries = sorted(buckets.get(bucket, []))
        if not entries:
            continue
        append_entries(bucket, entries)
        added += len(entries)

    print(f"✅ Imported {added} new compounds (markdown now has {len(keys) + added} entries).")
    if added == 0:
        print("   Nothing new to import.")


if __name__ == "__main__":
    main()
