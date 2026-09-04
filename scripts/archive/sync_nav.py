# -*- coding: utf-8 -*-
import glob
import re

UNIFIED_NAV = """      <!-- Navigation Links -->
      <nav>
        <ul class="nav-links" id="nav-links">
          <li><a href="index.html" class="nav-link" data-nav="home">หน้าแรก</a></li>
          <li class="nav-dropdown">
            <a href="browse.html" class="nav-link" data-nav="dictionary">พจนานุกรม</a>
            <ul class="dropdown-menu">
              <li><a href="browse.html">คันจิ (漢字)</a></li>
              <li class="nav-dropdown-submenu">
                <a href="vocabulary.html">คำศัพท์ (語彙) <span>▸</span></a>
                <ul class="dropdown-sub-menu">
                  <li><a href="vocabulary.html">ทั้งหมด (All)</a></li>
                  <li><a href="vocabulary.html?cat=yojijukugo">สุภาษิต 4 ตัวอักษร (四字熟語)</a></li>
                  <li><a href="vocabulary.html?cat=animals">สัตว์ในคันจิ (動物)</a></li>
                  <li><a href="vocabulary.html?cat=plants">พืช ดอกไม้ ผลไม้ (植物・花)</a></li>
                  <li><a href="vocabulary.html?cat=countries">ชื่อประเทศในคันจิ (国名)</a></li>
                  <li><a href="vocabulary.html?cat=anime-bleach">มังงะและอนิเมะ (アニメ)</a></li>
                  <li><a href="special-readings.html">คำอ่านพิเศษ (付表)</a></li>
                </ul>
              </li>
              <li><a href="radicals.html">ตารางหมวดอักษร (部首 214 ตัว)</a></li>
            </ul>
          </li>
          <li class="nav-dropdown">
            <a href="kanji-knowledge.html" class="nav-link" data-nav="knowledge">คลังความรู้</a>
            <ul class="dropdown-menu">
              <li><a href="kanji-knowledge.html">ภาพรวมคลังความรู้</a></li>
              <li><a href="kanji-history.html">ประวัติศาสตร์คันจิ</a></li>
              <li><a href="handwriting-guide.html">มาตรฐานรูปแบบอักษรคันจิ</a></li>
              <li><a href="kanken-guide.html">การทดสอบคันจิ (漢検)</a></li>
              <li><a href="about-radicals.html">เกี่ยวกับ Radicals (部首)</a></li>
              <li><a href="about-jukugo.html">เกี่ยวกับ 熟語 (คำประสม)</a></li>
            </ul>
          </li>
          <li><a href="kanji-games.html" class="nav-link" data-nav="games">เกมคันจิ</a></li>
          <li class="nav-dropdown">
            <a href="tools.html" class="nav-link" data-nav="tools">เครื่องมือ</a>
            <ul class="dropdown-menu">
              <li><a href="kanji-worksheet.html">ตัวสร้างใบงานคัดลายมือ</a></li>
              <li><a href="tools.html">เครื่องมือทั้งหมด</a></li>
            </ul>
          </li>
          <li><a href="about.html" class="nav-link" data-nav="about">เกี่ยวกับ</a></li>
        </ul>
      </nav>"""

nav_pattern = re.compile(r'(\s*<!-- Navigation Links -->\s*<nav>.*?</nav>|\s*<nav>.*?</nav>)', re.DOTALL)

html_files = sorted(glob.glob('*.html'))
updated = 0

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content, count = nav_pattern.subn(UNIFIED_NAV, content, count=1)
    if count > 0:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated += 1
        print(f"Synchronized nav in {file}")
    else:
        print(f"Warning: nav tag not found in {file}")

print(f"\nSuccessfully synchronized nav across {updated} files!")
