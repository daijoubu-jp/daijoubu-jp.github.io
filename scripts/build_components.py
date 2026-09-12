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
    args = parser.parse_args()

    raw = read_source(args.source)
    digest = hashlib.sha256(raw).hexdigest()
    print(f"   sha256: {digest}")
    if digest != EXPECTED_SHA256:
        print("   ⚠️  sha256 differs from the recorded source; output may change.")

    dataset = load_dataset()
    dataset_set = set(dataset)
    decompositions = parse(raw)

    entries = {}
    pool = set()
    for kanji in dataset:
        components = decompositions.get(kanji)
        if not components or len(components) < 2:
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
