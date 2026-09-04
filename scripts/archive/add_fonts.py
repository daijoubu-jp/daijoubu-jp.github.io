import re

html_files = [
    'index.html',
    'browse.html',
    'kanji.html',
    'special-readings.html',
    'handwriting-guide.html',
    'about.html'
]

font_links = """
  <!-- Google Fonts Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Sans+Thai+Looped:wght@300;400;500;600;700&family=Noto+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Noto+Serif+JP:wght@400;600;700;900&display=swap" rel="stylesheet">
  
  <!-- CSS Stylesheets -->"""

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace('<!-- CSS Stylesheets -->', font_links.strip())
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Added fonts to {fpath}")
