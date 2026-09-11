#!/usr/bin/env python3
"""
watch_content.py
Developer utility that watches the content/ directory for file modifications
and automatically triggers compile_content.py in real-time.
"""

import os
import sys
import time
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(BASE_DIR, "content")
COMPILE_SCRIPT = os.path.join(BASE_DIR, "scripts", "compile_content.py")


def get_mtimes():
    mtimes = {}
    for root, _, files in os.walk(CONTENT_DIR):
        for f in files:
            if f.endswith(".md"):
                fpath = os.path.join(root, f)
                try:
                    mtimes[fpath] = os.path.getmtime(fpath)
                except OSError:
                    pass
    return mtimes


def main():
    print("👀 Watching content/ directory for changes... (Press Ctrl+C to stop)")
    print(f"   Root: {CONTENT_DIR}\n")
    last_mtimes = get_mtimes()

    try:
        while True:
            time.sleep(1.0)
            current_mtimes = get_mtimes()
            
            changed = []
            for path, mtime in current_mtimes.items():
                if path not in last_mtimes or mtime > last_mtimes[path]:
                    changed.append(os.path.relpath(path, BASE_DIR))
            
            # Check for deleted files
            for path in list(last_mtimes.keys()):
                if path not in current_mtimes:
                    changed.append(os.path.relpath(path, BASE_DIR) + " (deleted)")

            if changed:
                changed_str = ", ".join(changed)
                print(f"\n⚡ Change detected in: {changed_str}")
                print("   Compiling Markdown to JSON...")
                res = subprocess.run([sys.executable, COMPILE_SCRIPT], capture_output=True, text=True)
                if res.returncode == 0:
                    print("   ✅ Recompiled successfully!")
                else:
                    print(f"   ❌ Compilation error:\n{res.stderr}")
                last_mtimes = current_mtimes
    except KeyboardInterrupt:
        print("\n👋 Stopped watching.")


if __name__ == "__main__":
    main()