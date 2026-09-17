#!/usr/bin/env python3
"""
strip_kanjivg_prologs.py
One-shot maintenance pass: replace the per-file KanjiVG boilerplate (XML
prolog + multi-line license comment) with the one-line attribution comment
that scripts/fetch_kanjivg.py now writes, so committed SVGs and re-fetched
SVGs stay byte-identical.

Stroke data inside <svg> is untouched. Attribution also lives in about.html
and the page footer (see AGENTS.md).

Usage:
  python3 scripts/strip_kanjivg_prologs.py [--dry-run]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_kanjivg import sanitize  # noqa: E402  (keep both paths in sync)

KANJIVG_DIR = Path(__file__).resolve().parent.parent / "data" / "kanjivg"


def main():
    dry = "--dry-run" in sys.argv
    changed = 0
    skipped = 0
    saved = 0

    for p in sorted(KANJIVG_DIR.glob("*.svg")):
        raw = p.read_bytes()
        new = sanitize(raw)
        if new == raw:
            skipped += 1
            continue
        changed += 1
        saved += len(raw) - len(new)
        if not dry:
            p.write_bytes(new)

    prefix = "[dry-run] " if dry else ""
    print(f"{prefix}{changed} files stripped ({saved / 1e6:.2f} MB saved), "
          f"{skipped} already clean.")


if __name__ == "__main__":
    main()
