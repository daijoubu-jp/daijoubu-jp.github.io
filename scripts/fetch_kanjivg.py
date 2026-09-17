#!/usr/bin/env python3
"""
fetch_kanjivg.py
Downloads the KanjiVG stroke-order SVGs used by this site into data/kanjivg/.

Only codepoints present in data/kanji.min.json are extracted. The archive is
pinned to a specific KanjiVG commit for reproducibility.

Usage:
  python3 scripts/fetch_kanjivg.py [--force]

KanjiVG is (C) Ulrich Apel and contributors, licensed CC BY-SA 3.0:
https://kanjivg.tagaini.net/
"""

import argparse
import json
import os
import re
import sys
import tarfile
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUT_DIR = os.path.join(DATA_DIR, "kanjivg")

KANJIVG_COMMIT = "422b5538595676da918c288a4230cb5e22a1ee7e"
ARCHIVE_URL = f"https://codeload.github.com/KanjiVG/kanjivg/tar.gz/{KANJIVG_COMMIT}"
MEMBER_RE = re.compile(r"(?:^|/)kanji/([0-9a-f]{5})\.svg$")

ATTRIBUTION = ("<!-- KanjiVG stroke data (C) Ulrich Apel & contributors, "
               "CC BY-SA 3.0 - https://kanjivg.tagaini.net -->\n")


def sanitize(raw: bytes) -> bytes:
    """Replace KanjiVG's per-file boilerplate (XML prolog + license block) with
    a one-line attribution comment. Full attribution also lives in about.html
    and the page footer; this trims ~30% of wire bytes from every SVG.
    The <svg> element itself is untouched."""
    text = raw.decode("utf-8")
    i = text.find("<svg")
    if i <= 0:
        return raw
    return (ATTRIBUTION + text[i:]).encode("utf-8")


def load_codepoints():
    """Return the set of 5-digit lowercase hex codepoints used by the site."""
    master_path = os.path.join(DATA_DIR, "kanji.min.json")
    if not os.path.exists(master_path):
        print("⚠️ data/kanji.min.json not found. Run scripts/compile_content.py first.")
        sys.exit(1)

    with open(master_path, "r", encoding="utf-8") as f:
        master = json.load(f)

    codepoints = set()
    for entry in master:
        cp = (entry.get("codepoint") or "").strip().lower()
        if cp:
            codepoints.add(cp.zfill(5))
    return codepoints


def missing_codepoints(codepoints):
    return {cp for cp in codepoints
            if not os.path.exists(os.path.join(OUT_DIR, f"{cp}.svg"))}


def fetch_archive(codepoints, force):
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"⬇️  Downloading KanjiVG archive ({KANJIVG_COMMIT[:12]})...")
    request = urllib.request.Request(
        ARCHIVE_URL, headers={"User-Agent": "daijoubu-jp-fetch-kanjivg"}
    )
    written = 0
    seen = set()

    with urllib.request.urlopen(request, timeout=120) as response:
        with tarfile.open(fileobj=response, mode="r|gz") as archive:
            for member in archive:
                match = MEMBER_RE.search(member.name)
                if not match:
                    continue

                cp = match.group(1)
                if cp not in codepoints or cp in seen:
                    continue
                seen.add(cp)

                target = os.path.join(OUT_DIR, f"{cp}.svg")
                if os.path.exists(target) and not force:
                    continue

                source = archive.extractfile(member)
                if source is None:
                    continue
                with open(target, "wb") as out:
                    out.write(sanitize(source.read()))

                written += 1
                if written % 500 == 0:
                    print(f"   ... {written} SVGs written")

    return seen


def main():
    parser = argparse.ArgumentParser(description="Vendor KanjiVG SVGs into data/kanjivg/.")
    parser.add_argument("--force", action="store_true",
                        help="Re-download SVGs that already exist.")
    args = parser.parse_args()

    codepoints = load_codepoints()
    missing_before = missing_codepoints(codepoints)

    if not missing_before and not args.force:
        print(f"✅ data/kanjivg/ already contains all {len(codepoints)} SVGs.")
        return

    fetched = fetch_archive(codepoints, args.force)

    missing = sorted(cp for cp in codepoints if not os.path.exists(
        os.path.join(OUT_DIR, f"{cp}.svg")))
    print(f"✅ data/kanjivg/: {len(codepoints) - len(missing)} SVGs present, "
          f"{len(missing)} missing.")

    if missing:
        print("⚠️ Missing codepoints (no KanjiVG file): " + ", ".join(missing[:20])
              + (" ..." if len(missing) > 20 else ""))
        print(f"   KanjiVG commit: {KANJIVG_COMMIT}")
        sys.exit(1)


if __name__ == "__main__":
    main()
