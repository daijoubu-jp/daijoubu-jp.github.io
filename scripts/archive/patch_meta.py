import os

html_files = [
    'index.html',
    'browse.html',
    'kanji.html',
    'special-readings.html',
    'handwriting-guide.html',
    'about.html'
]

og_tags = """  <!-- SEO & Social Sharing (Open Graph) -->
  <meta property="og:title" content="พจนานุกรมคันจิ สำหรับคนไทย | KanjiThai">
  <meta property="og:description" content="พจนานุกรมคันจิออนไลน์สำหรับผู้เรียนภาษาญี่ปุ่นชาวไทย ครอบคลุมคันจิโจโย 2,136 ตัว และคันจิคันเค็นระดับสูง">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/06f22.svg">
  <meta name="twitter:card" content="summary">"""

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if OG tags already exist to avoid duplicates
    if "og:title" not in content:
        # Insert after <meta name="description"...>
        content = content.replace(
            '<meta name="description" content="พจนานุกรมคันจิออนไลน์สำหรับผู้เรียนภาษาญี่ปุ่นชาวไทย ครอบคลุมคันจิโจโย 2,136 ตัว และคันจิคันเค็นระดับสูง พร้อมเสียงอ่าน ความหมายภาษาไทย และลำดับขีด">',
            '<meta name="description" content="พจนานุกรมคันจิออนไลน์สำหรับผู้เรียนภาษาญี่ปุ่นชาวไทย ครอบคลุมคันจิโจโย 2,136 ตัว และคันจิคันเค็นระดับสูง พร้อมเสียงอ่าน ความหมายภาษาไทย และลำดับขีด">\n' + og_tags
        )
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added Open Graph tags to {fpath}")

