import re
import glob

html_files = glob.glob('*.html')

new_nav = """<ul class="nav-links" id="nav-links">
          <li><a href="index.html" class="nav-link">หน้าแรก</a></li>
          <li><a href="browse.html" class="nav-link">ค้นหาและกรอง (Browse)</a></li>
          <li><a href="kanji-knowledge.html" class="nav-link">เกร็ดความรู้ (Knowledge)</a></li>
          <li><a href="kanji-games.html" class="nav-link">เกมคันจิ (Games)</a></li>
          <li><a href="about.html" class="nav-link">เกี่ยวกับ / คู่มือ</a></li>
        </ul>"""

pattern = re.compile(r'<ul class="nav-links" id="nav-links">.*?</ul>', re.DOTALL)

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    updated_content = pattern.sub(new_nav, content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"Updated navigation in {fpath}")

