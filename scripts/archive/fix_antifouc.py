import glob

html_files = glob.glob('*.html')

old_pattern = """  <!-- Theme Setup (Anti-FOUC) -->
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem('kanjithai_theme') || 'spring';
        var savedMode = localStorage.getItem('kanjithai_mode') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-mode', savedMode);
      } catch (e) {}
    })();
  </script>"""

new_pattern = """  <!-- Theme Setup (Anti-FOUC) -->
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem('kanji-theme') || localStorage.getItem('kanjithai_theme') || 'spring';
        var savedMode = localStorage.getItem('kanji-theme-mode') || localStorage.getItem('kanjithai_mode') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-mode', savedMode);
      } catch (e) {}
    })();
  </script>"""

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated Anti-FOUC in {fpath}")
    else:
        print(f"Pattern not found in {fpath}, checking manual replace...")
        # fallback regex if whitespace differs
        import re
        content = re.sub(
            r"var savedTheme = localStorage\.getItem\('kanjithai_theme'\) \|\| 'spring';",
            "var savedTheme = localStorage.getItem('kanji-theme') || localStorage.getItem('kanjithai_theme') || 'spring';",
            content
        )
        content = re.sub(
            r"var savedMode = localStorage\.getItem\('kanjithai_mode'\) \|\| 'light';",
            "var savedMode = localStorage.getItem('kanji-theme-mode') || localStorage.getItem('kanjithai_mode') || 'light';",
            content
        )
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Regex updated Anti-FOUC in {fpath}")
