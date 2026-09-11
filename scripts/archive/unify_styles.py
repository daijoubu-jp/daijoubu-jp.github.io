import re

# 1. Update kanji-knowledge.html
with open('kanji-knowledge.html', 'r', encoding='utf-8') as f:
    knowledge = f.read()
old_knowledge_hero = """    <div class="container">
      <section class="hub-hero">
        <h1 class="hub-title">คลังความรู้คันจิ <br> (Kanji Knowledge Base)</h1>
        <p class="hub-subtitle">ศูนย์รวมบทความ เกร็ดความรู้ (豆知識) และคู่มือต่างๆ สำหรับผู้เรียนภาษาญี่ปุ่น เพื่อทำความเข้าใจคันจิให้ลึกซึ้งยิ่งขึ้น</p>
      </section>

      <div class="hub-grid">"""
new_knowledge_hero = """    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">คลังความรู้คันจิ <br> (Kanji Knowledge Base)</h1>
        <p class="hero-subtitle" style="max-width: 600px; margin: 0 auto;">ศูนย์รวมบทความ เกร็ดความรู้ (豆知識) และคู่มือต่างๆ สำหรับผู้เรียนภาษาญี่ปุ่น เพื่อทำความเข้าใจคันจิให้ลึกซึ้งยิ่งขึ้น</p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl);">
      <div class="hub-grid">"""
knowledge = knowledge.replace(old_knowledge_hero, new_knowledge_hero)
with open('kanji-knowledge.html', 'w', encoding='utf-8') as f:
    f.write(knowledge)

# 2. Update kanji-games.html
with open('kanji-games.html', 'r', encoding='utf-8') as f:
    games = f.read()
old_games_hero = """    <div class="container">
      <section class="hub-hero">
        <h1 class="hub-title">ลานประลองคันจิ <br> (Kanji Games)</h1>
        <p class="hub-subtitle">สนุกไปกับการเรียนรู้และทบทวนคันจิผ่านมินิเกมต่างๆ (กำลังอยู่ระหว่างการพัฒนา เร็วๆ นี้!)</p>
      </section>

      <div class="hub-grid">"""
new_games_hero = """    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">ลานประลองคันจิ <br> (Kanji Games)</h1>
        <p class="hero-subtitle" style="max-width: 600px; margin: 0 auto;">สนุกไปกับการเรียนรู้และทบทวนคันจิผ่านมินิเกมต่างๆ (กำลังอยู่ระหว่างการพัฒนา เร็วๆ นี้!)</p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl);">
      <div class="hub-grid">"""
games = games.replace(old_games_hero, new_games_hero)
with open('kanji-games.html', 'w', encoding='utf-8') as f:
    f.write(games)

# 3. Update about.html
with open('about.html', 'r', encoding='utf-8') as f:
    about = f.read()
old_about = """    <div class="container" style="padding-top: var(--spacing-2xl); max-width: 860px;">
      
      <h1 style="font-size: clamp(1.6rem, 5vw, 2.25rem); margin-bottom: var(--spacing-xs);">เกี่ยวกับเว็บไซต์ KanjiThai</h1>
      <p style="color: var(--color-text-muted); font-size: var(--font-size-md); margin-bottom: var(--spacing-2xl);">
        พจนานุกรมคันจิออนไลน์ One-Stop สำหรับผู้เรียนภาษาญี่ปุ่นชาวไทย อ้างอิงตามเกณฑ์มาตรฐานทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁) และสมาคมสอบคันเค็น (漢検)
      </p>"""
new_about = """    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">เกี่ยวกับเว็บไซต์ KanjiThai</h1>
        <p class="hero-subtitle" style="max-width: 700px; margin: 0 auto;">
          พจนานุกรมคันจิออนไลน์ One-Stop สำหรับผู้เรียนภาษาญี่ปุ่นชาวไทย อ้างอิงตามเกณฑ์มาตรฐานทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁) และสมาคมสอบคันเค็น (漢検)
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl); max-width: 860px;">"""
about = about.replace(old_about, new_about)
with open('about.html', 'w', encoding='utf-8') as f:
    f.write(about)

# 4. Update special-readings.html
with open('special-readings.html', 'r', encoding='utf-8') as f:
    special = f.read()
old_special = """    <div class="container" style="padding-top: var(--spacing-2xl);">
      
      <!-- Page Header -->
      <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
        <h1 style="font-size: clamp(1.6rem, 5vw, 2.25rem); margin-bottom: var(--spacing-xs); font-family: var(--font-display-jp);">
          常用漢字表「付表」(คำอ่านพิเศษ / 熟字訓)
        </h1>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-md); max-width: 720px; margin: 0 auto; padding: 0 var(--spacing-xs);">
          รวบรวมคำศัพท์ที่เสียงอ่านไม่ได้แยกตามตัวอักษรแต่ละตัว แต่อ่านรวมกันทั้งกลุ่มคำ (Jukujikun) อ้างอิงจากตารางประกาศอย่างเป็นทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁)
        </p>
      </div>"""
new_special = """    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">常用漢字表「付表」(คำอ่านพิเศษ / 熟字訓)</h1>
        <p class="hero-subtitle" style="max-width: 720px; margin: 0 auto;">
          รวบรวมคำศัพท์ที่เสียงอ่านไม่ได้แยกตามตัวอักษรแต่ละตัว แต่อ่านรวมกันทั้งกลุ่มคำ (Jukujikun) อ้างอิงจากตารางประกาศอย่างเป็นทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁)
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl);">"""
special = special.replace(old_special, new_special)
with open('special-readings.html', 'w', encoding='utf-8') as f:
    f.write(special)

# 5. Update handwriting-guide.html
with open('handwriting-guide.html', 'r', encoding='utf-8') as f:
    handwriting = f.read()
old_hand = """    <div class="container" style="padding-top: var(--spacing-2xl); max-width: 900px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
        <h1 style="font-size: clamp(1.5rem, 5vw, 2.25rem); margin-bottom: var(--spacing-xs); font-family: var(--font-display-jp);">
          常用漢字表の字体・字形に関する指針
        </h1>
        <p style="color: var(--color-text-muted); font-size: var(--font-size-md); padding: 0 var(--spacing-xs);">
          คู่มือและแนวทางการเขียนคันจิด้วยลายมือ vs ฟอนต์ตัวพิมพ์ อ้างอิงจากรายงานอย่างเป็นทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁 平成28年報告)
        </p>
      </div>"""
new_hand = """    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">常用漢字表の字体・字形に関する指針</h1>
        <p class="hero-subtitle" style="max-width: 800px; margin: 0 auto;">
          คู่มือและแนวทางการเขียนคันจิด้วยลายมือ vs ฟอนต์ตัวพิมพ์ อ้างอิงจากรายงานอย่างเป็นทางการของทบวงวัฒนธรรมญี่ปุ่น (文化庁 平成28年報告)
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl); max-width: 900px;">"""
handwriting = handwriting.replace(old_hand, new_hand)
with open('handwriting-guide.html', 'w', encoding='utf-8') as f:
    f.write(handwriting)

# Clean up CSS (Remove .hub-hero, .hub-title, .hub-subtitle)
with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = re.sub(r'\.hub-hero \{[^\}]+\}\s+', '', css)
css = re.sub(r'\.hub-title \{[^\}]+\}\s+', '', css)
css = re.sub(r'\.hub-subtitle \{[^\}]+\}\s+', '', css)

with open('assets/css/components.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Unified hero sections across all pages!")
