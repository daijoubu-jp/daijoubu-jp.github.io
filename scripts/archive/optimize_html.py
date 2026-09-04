import re

html_files = [
    'index.html',
    'browse.html',
    'kanji.html',
    'special-readings.html',
    'handwriting-guide.html',
    'about.html'
]

fouc_script = """
  <!-- Theme Setup (Anti-FOUC) -->
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

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the Tailwind script and its config
    # The pattern matches exactly the comment + tailwind cdn + config block
    pattern = r'<!-- Tailwind CSS CDN.*?<\/script>\s*<script>.*?<\/script>'
    
    new_content = re.sub(pattern, fouc_script.strip(), content, flags=re.DOTALL)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Optimized {fpath}")
