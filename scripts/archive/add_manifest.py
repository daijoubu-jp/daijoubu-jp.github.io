import re

html_files = [
    'index.html',
    'browse.html',
    'kanji.html',
    'special-readings.html',
    'handwriting-guide.html',
    'about.html'
]

manifest_link = """
  <!-- PWA Manifest & Icons -->
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>漢</text></svg>">
  
  <!-- Google Fonts Preconnect -->"""

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace('<!-- Google Fonts Preconnect -->', manifest_link.strip())
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Added manifest to {fpath}")
