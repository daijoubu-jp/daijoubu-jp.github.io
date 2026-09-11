import re
import glob

html_files = glob.glob('*.html')

new_nav = """<ul class="nav-links" id="nav-links">
          <li><a href="index.html" class="nav-link" data-nav="home">หน้าแรก</a></li>
          <li><a href="browse.html" class="nav-link" data-nav="browse">ค้นหาและกรอง (Browse)</a></li>
          <li class="nav-dropdown">
            <a href="kanji-knowledge.html" class="nav-link" data-nav="knowledge">เกร็ดความรู้ (Knowledge)</a>
            <ul class="dropdown-menu">
              <li><a href="handwriting-guide.html">คู่มือลายมือคันจิ</a></li>
              <li><a href="special-readings.html">คำอ่านพิเศษ (付表)</a></li>
            </ul>
          </li>
          <li class="nav-dropdown">
            <a href="kanji-games.html" class="nav-link" data-nav="games">เกมคันจิ (Games)</a>
            <ul class="dropdown-menu">
              <li><a href="#" class="disabled">ควิซทายความหมาย (Coming Soon)</a></li>
              <li><a href="#" class="disabled">จับคู่คันจิ (Coming Soon)</a></li>
              <li><a href="#" class="disabled">แฟลชการ์ด (Coming Soon)</a></li>
            </ul>
          </li>
          <li><a href="about.html" class="nav-link" data-nav="about">เกี่ยวกับ / คู่มือ</a></li>
        </ul>"""

pattern = re.compile(r'<ul class="nav-links" id="nav-links">.*?</ul>', re.DOTALL)

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    updated_content = pattern.sub(new_nav, content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print(f"Updated navigation with dropdowns in {fpath}")

