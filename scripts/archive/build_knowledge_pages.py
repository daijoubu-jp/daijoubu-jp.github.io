# -*- coding: utf-8 -*-

# 1. kanji-history.html
history_html = """<!DOCTYPE html>
<html lang="th" data-theme="spring" data-mode="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="ประวัติศาสตร์และวิวัฒนาการของคันจิ (History of Kanji) - เจาะลึกจุดกำเนิดจากอักษรกระดูกสัตว์สู่ญี่ปุ่น การกำเนิดฮิรางานะ-คาตาคานะ และการปฏิรูปโจโยคันจิ">
  <meta name="theme-color" content="#FFF9FB">
  <title>ประวัติศาสตร์และวิวัฒนาการคันจิ (History of Kanji) | KanjiThai</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/themes/spring.css">
  <link rel="stylesheet" href="assets/css/themes/summer.css">
  <link rel="stylesheet" href="assets/css/themes/autumn.css">
  <link rel="stylesheet" href="assets/css/themes/winter.css">
  <link rel="stylesheet" href="assets/css/themes/anime.css">
  <link rel="stylesheet" href="assets/css/themes/ukiyoe.css">
</head>
<body data-page="knowledge">

  <!-- Site Header -->
  <header class="site-header">
    <div class="container">
      <button type="button" class="nav-menu-toggle-btn" id="nav-menu-toggle-btn" aria-label="เปิดเมนูหลัก" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <a href="index.html" class="nav-brand">
        <div class="nav-brand-logo">漢</div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">KanjiThai</span>
          <span class="nav-brand-sub">พจนานุกรมคันจิไทย-ญี่ปุ่น</span>
        </div>
      </a>

      <!-- Navigation Links -->
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
            <a href="kanji-knowledge.html" class="nav-link active" data-nav="knowledge">คลังความรู้</a>
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
      </nav>

      <div class="nav-actions">
        <div class="mode-toggle-switch header-mode-switch" id="header-mode-switch" role="switch" aria-label="สลับโหมดสว่าง/โหมดมืด" tabindex="0" title="สลับโหมดสว่าง / โหมดมืด">
          <span class="mode-switch-icon">☀️</span>
          <span class="mode-switch-icon">🌙</span>
          <span class="mode-switch-thumb"></span>
        </div>
        <div class="theme-switcher">
          <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="เปลี่ยนธีม">
            <span>🌸</span> <span class="theme-current-name">ฤดูใบไม้ผลิ</span>
          </button>
          <div class="theme-dropdown" id="theme-dropdown"></div>
        </div>
      </div>
    </div>
  </header>

  <main class="main-content">
    <section class="hero-section" style="padding: 2.5rem 0 1.5rem;">
      <div class="container" style="text-align: center;">
        <h1 class="hero-title" style="font-size: clamp(1.85rem, 4vw, 2.75rem); margin-bottom: 0.5rem;">
          ประวัติศาสตร์และวิวัฒนาการของคันจิ <br>
          <span style="font-size: clamp(1.1rem, 2.5vw, 1.5rem); color: var(--color-accent); font-weight: 600;">(漢字の歴史と変遷 • The History of Kanji)</span>
        </h1>
        <p class="hero-subtitle" style="max-width: 780px; margin: 0 auto; font-size: var(--font-size-sm); color: var(--color-text-muted);">
          เดินทางข้ามกาลเวลากว่า 3,300 ปี จากรอยสลักบนกระดองเต่าในยุคโบราณ สู่การเดินทางข้ามทะเลสู่หมู่เกาะญี่ปุ่น กำเนิดตัวอักษรคะนะ และการปฏิรูประบบตัวอักษรยุคใหม่
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl); max-width: 920px;">
      
      <!-- Era 1: Origins -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--spacing-sm);">
          <span style="font-size: 1.5rem;">🐢</span>
          <h2 style="font-size: var(--font-size-xl); color: var(--color-accent); margin: 0;">1. จุดกำเนิดในแผ่นดินจีนโบราณ (1300–200 BCE)</h2>
        </div>
        <p style="line-height: 1.8; color: var(--color-text); margin-bottom: var(--spacing-md);">
          อักษรคันจิมีรากเหง้ามาจาก <strong>อักษรกระดูกสัตว์ (甲骨文字: โคคตสึมงจิ)</strong> ในสมัยราชวงศ์ซาง (ราว 1,300 ปีก่อนคริสตกาล) หมอดูและนักบวชจะสลักคำถามเกี่ยวกับการเกษตร สงคราม และสุขภาพลงบนกระดองเต่าหรือกระดูกสะบักวัว แล้วนำไปเผาไฟเพื่อทำนายคำตอบจากรอยร้าวที่เกิดขึ้น
        </p>
        <div style="background: var(--color-surface-2); border-radius: var(--border-radius-sm); padding: var(--spacing-md); margin-bottom: var(--spacing-sm);">
          <h3 style="font-size: 1rem; margin-bottom: 8px; color: var(--color-text);">ลำดับขั้นวิวัฒนาการสัณฐานอักษรจีน (書体の変遷):</h3>
          <ul style="padding-left: 20px; line-height: 1.8; color: var(--color-text-muted); font-size: var(--font-size-sm);">
            <li><strong>甲骨文字 (อักษรกระดูกสัตว์):</strong> ลายเส้นภาพเหลี่ยม สลักด้วยมีดลงบนกระดูก</li>
            <li><strong>金文 (อักษรสำริด):</strong> ตัวอักษรหล่อบนภาชนะสัมฤทธิ์ในสมัยราชวงศ์โจว ลายเส้นเริ่มโค้งมนขึ้น</li>
            <li><strong>篆書 (อักษรตราประทับ/เสี่ยวจ้วน):</strong> จักรพรรดิฉินซีฮ่องเต้รวมแผ่นดินและรวมระบบตัวอักษรเป็นหนึ่งเดียว ลายเส้นสมมาตรสวยงาม</li>
            <li><strong>隷書 (อักษรทาส/เสมียน):</strong> เปลี่ยนจากเส้นโค้งมนเป็นเส้นตรงและเหลี่ยม เขียนรวดเร็วขึ้นด้วยพู่กัน</li>
            <li><strong>楷書 (อักษรบรรจงมาตรฐาน):</strong> ถือกำเนิดในสมัยราชวงศ์ฮั่นตอนปลาย กลายเป็นมาตรฐานตัวพิมพ์คันจิจนถึงปัจจุบัน</li>
          </ul>
        </div>
      </article>

      <!-- Era 2: Arrival in Japan -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--spacing-sm);">
          <span style="font-size: 1.5rem;">⛩️</span>
          <h2 style="font-size: var(--font-size-xl); color: var(--color-accent); margin: 0;">2. การเดินทางข้ามทะเลสู่หมู่เกาะญี่ปุ่น (ศตวรรษที่ 4–7)</h2>
        </div>
        <p style="line-height: 1.8; color: var(--color-text); margin-bottom: var(--spacing-sm);">
          ก่อนการรับอักษรคันจิ ประเทศญี่ปุ่นมีเพียง <strong>ภาษาพูด (Yamato Kotoba)</strong> แต่ยังไม่มีระบบลายลักษณ์อักษรของตนเอง คันจิเริ่มหลั่งไหลเข้าสู่ญี่ปุ่นผ่านเหรียญกษาปณ์ ดาบโบราณ และการทูตผ่านคาบสมุทรเกาหลี จนกระทั่งในศตวรรษที่ 5 ปราชญ์ชาวแพ็กเจอย่าง <em>หวังเหริน (王仁: วานิ)</em> ได้นำคัมภีร์ *หลุนอวี่ (論語)* และ *พันอักษร (千字文)* มาถวายราชสำนักยามาโตะ
        </p>
        <p style="line-height: 1.8; color: var(--color-text);">
          ความท้าทายครั้งประวัติศาสตร์คือ <strong>ไวยากรณ์ภาษาญี่ปุ่นแตกต่างจากภาษาจีนอย่างสิ้นเชิง</strong> ชาวญี่ปุ่นจึงประดิษฐ์ระบบ <strong>เสียงอง (音読み: อนโยมิ)</strong> ยืมเสียงจีนโบราณ และ <strong>เสียงคุน (訓読み: คุนโยมิ)</strong> นำคันจิจีนมาแทนคำแท้ของภาษาญี่ปุ่น
        </p>
      </article>

      <!-- Era 3: Manyogana & Kana -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--spacing-sm);">
          <span style="font-size: 1.5rem;">📜</span>
          <h2 style="font-size: var(--font-size-xl); color: var(--color-accent); margin: 0;">3. ยุค Man'yogana สู่การกำเนิดอักษรคะนะ (ศตวรรษที่ 8–10)</h2>
        </div>
        <p style="line-height: 1.8; color: var(--color-text); margin-bottom: var(--spacing-md);">
          ในยุคนาระ กวีได้คิดค้น <strong>มังโยงานะ (万葉仮名)</strong> โดยนำคันจิมาใช้สะกดเสียงอ่านภาษาญี่ปุ่นคำต่อคำ (เช่น ยืมคันจิ 夜มาออกเสียง Ya, 麻 มาออกเสียง Ma) ซึ่งปรากฏในวรรณคดีรวมบทกวี <em>มันโยชู (万葉集)</em>
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md);">
          <div style="background: var(--color-surface-2); padding: var(--spacing-md); border-radius: var(--border-radius-sm); border-left: 3px solid #ec4899;">
            <h4 style="color: #ec4899; margin-bottom: 6px;">🌸 กำเนิดฮิรางานะ (平仮名)</h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6;">
              เกิดจากการเขียนคันจิในแบบ <strong>อักษรหวัด (草書: โซโชะ)</strong> อย่างต่อเนื่องลื่นไหล สตรีในราชสำนักยุคเฮอันนิยมใช้เขียนบันทึกไดอารี่และวรรณกรรมระดับโลก เช่น *ตำนานเก็นจิ (源氏物語)* โดย มุราซากิ ชิกิบุ
              <br><em>เช่น: 安 ➔ あ, 以 ➔ い, 宇 ➔ う</em>
            </p>
          </div>
          <div style="background: var(--color-surface-2); padding: var(--spacing-md); border-radius: var(--border-radius-sm); border-left: 3px solid #3b82f6;">
            <h4 style="color: #3b82f6; margin-bottom: 6px;">📐 กำเนิดคาตาคานะ (片仮名)</h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6;">
              เกิดจากพระสงฆ์และนักวิชาการที่ต้องจดบันทึกคำอธิบายสั้นๆ ข้างคัมภีร์พุทธศาสนา จึง <strong>ตัดชิ้นส่วนบางเสี้ยว</strong> ของคันจิบรรจง (楷書) เพื่อความกระชับรวดเร็ว
              <br><em>เช่น: 阿 ➔ ア, 伊 ➔ イ, 宇 ➔ ウ</em>
            </p>
          </div>
        </div>
      </article>

      <!-- Era 4: Modern Reforms -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--spacing-sm);">
          <span style="font-size: 1.5rem;">🏛️</span>
          <h2 style="font-size: var(--font-size-xl); color: var(--color-accent); margin: 0;">4. การปฏิรูปตัวอักษรยุคใหม่และตารางโจโยคันจิ (1946–ปัจจุบัน)</h2>
        </div>
        <p style="line-height: 1.8; color: var(--color-text); margin-bottom: var(--spacing-md);">
          ก่อนสงครามโลกครั้งที่ 2 ญี่ปุ่นใช้คันจิโบราณนับหมื่นตัว (旧字体: คิวจิไต) เส้นขีดซับซ้อนมาก หลังสงคราม รัฐบาลญี่ปุ่นและทบวงวัฒนธรรม (文化庁) ได้ปฏิรูประบบตัวอักษรเพื่อส่งเสริมการรู้หนังสือของประชาชน:
        </p>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); min-width: 500px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border); background: var(--color-surface-2);">
                <th style="padding: 10px; text-align: left;">ปี ค.ศ.</th>
                <th style="padding: 10px; text-align: left;">รายชื่อมาตรฐาน</th>
                <th style="padding: 10px; text-align: left;">จำนวนตัวอักษร</th>
                <th style="padding: 10px; text-align: left;">สาระสำคัญ</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--color-border-subtle);">
                <td style="padding: 10px; font-weight: 700;">1946</td>
                <td style="padding: 10px;">当用漢字 (โทโยคันจิ)</td>
                <td style="padding: 10px;">1,850 ตัว</td>
                <td style="padding: 10px; color: var(--color-text-muted);">จำกัดการใช้ในชีวิตประจำวัน และย่อรูปขีดคันจิให้ง่ายขึ้น (新字体)</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border-subtle);">
                <td style="padding: 10px; font-weight: 700;">1981</td>
                <td style="padding: 10px;">常用漢字 (โจโยคันจิ ฉบับแรก)</td>
                <td style="padding: 10px;">1,945 ตัว</td>
                <td style="padding: 10px; color: var(--color-text-muted);">เปลี่ยนนโยบายจาก "จำกัด" เป็น "เกณฑ์แนะนำ" เพิ่มคันจิ 95 ตัว</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border-subtle); background: rgba(16, 185, 129, 0.05);">
                <td style="padding: 10px; font-weight: 700; color: #10b981;">2010 (ปัจจุบัน)</td>
                <td style="padding: 10px; font-weight: 700; color: #10b981;">改定常用漢字 (โจโยคันจิปรับปรุงใหม่)</td>
                <td style="padding: 10px; font-weight: 700; color: #10b981;">2,136 ตัว</td>
                <td style="padding: 10px; color: var(--color-text-muted);">เพิ่มคันจิที่พบบ่อยในยุคคอมพิวเตอร์ 196 ตัว (เช่น 岡, 鬱, 憧) และตัดออก 5 ตัว</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        เนื้อหาเรียบเรียงจากเอกสารประวัติศาสตร์ภาษาศาสตร์ญี่ปุ่นและทบวงวัฒนธรรมญี่ปุ่น | KanjiThai © 2026
      </div>
    </div>
  </footer>

  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
"""

with open('kanji-history.html', 'w', encoding='utf-8') as f:
    f.write(history_html)
print("Created kanji-history.html")

# 2. about-radicals.html
radicals_guide_html = """<!DOCTYPE html>
<html lang="th" data-theme="spring" data-mode="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="เจาะลึกหมวดอักษรคันจิ 7 ตำแหน่ง (The Anatomy of Radicals) - ทำความรู้จักบุชุ へん, つくり, かんむり, あし, たれ, にょう, かまえ และเคล็ดลับเดาความหมายคันจิ">
  <meta name="theme-color" content="#FFF9FB">
  <title>เกี่ยวกับ Radicals หมวดอักษรคันจิ (部首の基礎知識) | KanjiThai</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/themes/spring.css">
  <link rel="stylesheet" href="assets/css/themes/summer.css">
  <link rel="stylesheet" href="assets/css/themes/autumn.css">
  <link rel="stylesheet" href="assets/css/themes/winter.css">
  <link rel="stylesheet" href="assets/css/themes/anime.css">
  <link rel="stylesheet" href="assets/css/themes/ukiyoe.css">
</head>
<body data-page="knowledge">

  <!-- Site Header -->
  <header class="site-header">
    <div class="container">
      <button type="button" class="nav-menu-toggle-btn" id="nav-menu-toggle-btn" aria-label="เปิดเมนูหลัก" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <a href="index.html" class="nav-brand">
        <div class="nav-brand-logo">漢</div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">KanjiThai</span>
          <span class="nav-brand-sub">พจนานุกรมคันจิไทย-ญี่ปุ่น</span>
        </div>
      </a>

      <!-- Navigation Links -->
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
            <a href="kanji-knowledge.html" class="nav-link active" data-nav="knowledge">คลังความรู้</a>
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
      </nav>

      <div class="nav-actions">
        <div class="mode-toggle-switch header-mode-switch" id="header-mode-switch" role="switch" aria-label="สลับโหมดสว่าง/โหมดมืด" tabindex="0" title="สลับโหมดสว่าง / โหมดมืด">
          <span class="mode-switch-icon">☀️</span>
          <span class="mode-switch-icon">🌙</span>
          <span class="mode-switch-thumb"></span>
        </div>
        <div class="theme-switcher">
          <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="เปลี่ยนธีม">
            <span>🌸</span> <span class="theme-current-name">ฤดูใบไม้ผลิ</span>
          </button>
          <div class="theme-dropdown" id="theme-dropdown"></div>
        </div>
      </div>
    </div>
  </header>

  <main class="main-content">
    <section class="hero-section" style="padding: 2.5rem 0 1.5rem;">
      <div class="container" style="text-align: center;">
        <h1 class="hero-title" style="font-size: clamp(1.85rem, 4vw, 2.75rem); margin-bottom: 0.5rem;">
          เจาะลึกหมวดอักษรคันจิ (部首) <br>
          <span style="font-size: clamp(1.1rem, 2.5vw, 1.5rem); color: var(--color-accent); font-weight: 600;">(The Anatomy & Positions of Kanji Radicals)</span>
        </h1>
        <p class="hero-subtitle" style="max-width: 780px; margin: 0 auto; font-size: var(--font-size-sm); color: var(--color-text-muted);">
          ทำความเข้าใจกุญแจสำคัญในการถอดรหัสความหมายของคันจิ 7 ตำแหน่งหลักของบุชุ และรูปแปลงร่างที่พบบ่อย
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl); max-width: 920px;">
      
      <!-- Intro Card -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl); border-left: 4px solid var(--color-accent);">
        <h2 style="font-size: var(--font-size-lg); color: var(--color-accent); margin-bottom: var(--spacing-xs);">
          💡 หมวดอักษร (部首: บุชุ) คืออะไร?
        </h2>
        <p style="line-height: 1.8; color: var(--color-text);">
          <strong>บุชุ (部首)</strong> แปลตรงตัวว่า "หัวหน้าหมวด" เปรียบเสมือน DNA หรือรากศัพท์ของตัวคันจิ คันจิส่วนใหญ่เกิดจากการรวมกันของสองส่วนคือ <strong>ส่วนบ่งชี้ความหมาย (意符: อิฟุ)</strong> ซึ่งมักทำหน้าที่เป็นบุชุ และ <strong>ส่วนบ่งชี้เสียงอ่าน (音符: อนปุ)</strong> ดังนั้น หากเรารู้ความหมายของบุชุ เราจะสามารถ <em>"คาดเดาความหมายของคันจิตัวใหม่ได้ทันทีแม้ไม่เคยเรียนมาก่อน"</em>
        </p>
      </article>

      <!-- 7 Positions Grid -->
      <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-md); color: var(--color-text);">
        📍 7 ตำแหน่งหลักของหมวดอักษร (部首の7つの位置)
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-2xl);">
        
        <!-- 1. Hen -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">1. 偏 (へん - เฮ็น)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">ฝั่งซ้าย [ | ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            อยู่ฝั่งซ้ายของตัวอักษร เป็นตำแหน่งที่พบบ่อยที่สุด สื่อถึงธรรมชาติหรือลักษณะพื้นฐาน
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 亻 (คน เช่น 休, 体), 氵 (น้ำ เช่น 海, 泳), 木 (ไม้ เช่น 村, 林)
          </div>
        </div>

        <!-- 2. Tsukuri -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">2. 旁 (つくり - ทสึคุริ)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">ฝั่งขวา [ | ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            อยู่ฝั่งขวาของตัวอักษร มักบ่งบอกการกระทำหรือเสียงอ่านของคำ
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 刂 (มีดดาบ เช่น 割, 別), 頁 (ศีรษะ/หน้า เช่น 頂, 順), 欠 (อ้าปาก เช่น 歌)
          </div>
        </div>

        <!-- 3. Kanmuri -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">3. 冠 (かんむり - คัมมุริ)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">ด้านบน [ ▔ ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            เปรียบเสมือนมงกุฎ สถิตอยู่ส่วนบนสุดของตัวอักษร
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 艹 (หญ้า/พืช เช่น 花, 草), 宀 (หลังคาบ้าน เช่น 家, 安), ⺮ (ไม้ไผ่ เช่น 筆)
          </div>
        </div>

        <!-- 4. Ashi -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">4. 脚 (あし - อาชิ)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">ด้านล่าง [   ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            อยู่ส่วนล่างสุดของตัวอักษร ดั่งเท้าที่ค้ำจุนหรือเปลวไฟด้านล่าง
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 灬 (ไฟล่าง เช่น 点, 照), 皿 (จานรอง เช่น 盆, 盛), 儿 (ขามนุษย์ เช่น 見, 兄)
          </div>
        </div>

        <!-- 5. Tare -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">5. 垂 (たれ - ทาเระ)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">บนซ้ายคลุม [ ┌ ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            ห้อยคลุมจากด้านบนลากลงมาทางด้านซ้าย ดั่งเพิงผาหรือหลังคาโรงเรือน
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 广 (เพิงผา เช่น 店, 広), 尸 (โครงศพ/ร่าง เช่น 居, 屋), 疒 (โรคภัย เช่น 病, 痛)
          </div>
        </div>

        <!-- 6. Nyo -->
        <div class="detail-card" style="padding: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">6. 繞 (にょう - เนียว)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">ซ้ายและฐานล่าง [ └ ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            โอบล้อมจากด้านซ้ายลงมาหนุนช้อนที่ฐานล่าง มักสื่อถึงการเดินทางหรือการเคลื่อนไหว
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 辶 (ทางเดิน เช่น 道, 近, 進), 走 (วิ่ง เช่น 起, 越)
          </div>
        </div>

        <!-- 7. Kamae -->
        <div class="detail-card" style="padding: var(--spacing-md); grid-column: 1 / -1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.15rem; color: var(--color-accent); margin: 0;">7. 構 (かまえ - คามาเอะ)</h3>
            <span style="font-size: 0.75rem; background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px;">กรอบล้อมรอบ [ ▢ / 冂 / 門 ]</span>
          </div>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            ล้อมรอบองค์ประกอบอื่น ไม่ว่าจะเป็นล้อมรอบทั้งสี่ด้าน ล้อมสามด้าน หรือล้อมเปิดล่าง
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 囗 (ล้อมรอบ เช่น 国, 園), 門 (ซุ้มประตู เช่น 間, 開), 勹 (โอบห่อ เช่น 包)
          </div>
        </div>

      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
        <a href="radicals.html" class="action-btn" style="padding: 12px 28px; font-size: 1rem; text-decoration: none; border-radius: var(--border-radius-full); display: inline-flex; align-items: center; gap: 8px;">
          <span>📖</span> เปิดดูตารางหมวดอักษรคันจิครบ 214 หมวด (214 Radicals Table) ➔
        </a>
      </div>

    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        ข้อมูลไวยากรณ์และสัณฐานวิทยาคันจิเพื่อการศึกษาภาษาญี่ปุ่น | KanjiThai © 2026
      </div>
    </div>
  </footer>

  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
"""

with open('about-radicals.html', 'w', encoding='utf-8') as f:
    f.write(radicals_guide_html)
print("Created about-radicals.html")

# 3. about-jukugo.html
jukugo_guide_html = """<!DOCTYPE html>
<html lang="th" data-theme="spring" data-mode="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="ศาสตร์แห่งคำประสมคันจิ (The Linguistics of Jukugo) - โครงสร้างไวยากรณ์ 6 รูปแบบ กฎการอ่านจูบาโกะ-ยูโตะ และความลึกซึ้งของสุภาษิต 4 ตัวอักษร (四字熟語)">
  <meta name="theme-color" content="#FFF9FB">
  <title>เกี่ยวกับ 熟語 คำประสมคันจิ (熟語の成り立ちと構成) | KanjiThai</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/themes/spring.css">
  <link rel="stylesheet" href="assets/css/themes/summer.css">
  <link rel="stylesheet" href="assets/css/themes/autumn.css">
  <link rel="stylesheet" href="assets/css/themes/winter.css">
  <link rel="stylesheet" href="assets/css/themes/anime.css">
  <link rel="stylesheet" href="assets/css/themes/ukiyoe.css">
</head>
<body data-page="knowledge">

  <!-- Site Header -->
  <header class="site-header">
    <div class="container">
      <button type="button" class="nav-menu-toggle-btn" id="nav-menu-toggle-btn" aria-label="เปิดเมนูหลัก" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <a href="index.html" class="nav-brand">
        <div class="nav-brand-logo">漢</div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">KanjiThai</span>
          <span class="nav-brand-sub">พจนานุกรมคันจิไทย-ญี่ปุ่น</span>
        </div>
      </a>

      <!-- Navigation Links -->
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
            <a href="kanji-knowledge.html" class="nav-link active" data-nav="knowledge">คลังความรู้</a>
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
      </nav>

      <div class="nav-actions">
        <div class="mode-toggle-switch header-mode-switch" id="header-mode-switch" role="switch" aria-label="สลับโหมดสว่าง/โหมดมืด" tabindex="0" title="สลับโหมดสว่าง / โหมดมืด">
          <span class="mode-switch-icon">☀️</span>
          <span class="mode-switch-icon">🌙</span>
          <span class="mode-switch-thumb"></span>
        </div>
        <div class="theme-switcher">
          <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" aria-label="เปลี่ยนธีม">
            <span>🌸</span> <span class="theme-current-name">ฤดูใบไม้ผลิ</span>
          </button>
          <div class="theme-dropdown" id="theme-dropdown"></div>
        </div>
      </div>
    </div>
  </header>

  <main class="main-content">
    <section class="hero-section" style="padding: 2.5rem 0 1.5rem;">
      <div class="container" style="text-align: center;">
        <h1 class="hero-title" style="font-size: clamp(1.85rem, 4vw, 2.75rem); margin-bottom: 0.5rem;">
          ศาสตร์แห่งคำประสมคันจิ (熟語) <br>
          <span style="font-size: clamp(1.1rem, 2.5vw, 1.5rem); color: var(--color-accent); font-weight: 600;">(The Linguistics & Grammar of Jukugo)</span>
        </h1>
        <p class="hero-subtitle" style="max-width: 780px; margin: 0 auto; font-size: var(--font-size-sm); color: var(--color-text-muted);">
          ไขรหัสลับโครงสร้างไวยากรณ์คำประสมคันจิ 6 รูปแบบ กฎการอ่านแบบลูกผสม (重箱・湯桶) และมนต์เสน่ห์แห่งสุภาษิต 4 ตัวอักษร
        </p>
      </div>
    </section>

    <div class="container" style="padding-top: var(--spacing-xl); max-width: 920px;">
      
      <!-- Intro Card -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl); border-left: 4px solid var(--color-accent);">
        <h2 style="font-size: var(--font-size-lg); color: var(--color-accent); margin-bottom: var(--spacing-xs);">
          📖 熟語 (จูคุโกะ) คืออะไร?
        </h2>
        <p style="line-height: 1.8; color: var(--color-text);">
          <strong>จูคุโกะ (熟語)</strong> คือคำศัพท์ที่เกิดจากการนำคันจิตั้งแต่ 2 ตัวขึ้นไปมาประสมกันจนเกิดเป็นคำศัพท์ใหม่ที่มีความหมายสมบูรณ์ในตัวเอง (เช่น 森林, 読書, 領域展開) การเข้าใจ <em>"ความสัมพันธ์เชิงตรรกะระหว่างคันจิแต่ละตัว"</em> จะช่วยให้ผู้เรียนสามารถจดจำคำศัพท์นับหมื่นคำได้อย่างแม่นยำและเป็นระบบ
        </p>
      </article>

      <!-- 6 Structural Patterns -->
      <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-md); color: var(--color-text);">
        🧩 6 โครงสร้างตรรกะของคำประสม (熟語の6つの構成)
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-2xl);">
        
        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">1. ความหมายคล้ายกัน (似た意味)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            คันจิสองตัวที่มีความหมายใกล้เคียงกันมารวมพลังเพื่อเน้นย้ำความหมายให้ชัดเจนขึ้น
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 森林 (ป่า + ดง), 変化 (เปลี่ยน + กลาย), 停止 (หยุด + นิ่ง), 永久 (นิรันดร์ + กาล)
          </div>
        </div>

        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">2. ความหมายตรงข้ามกัน (対立・対比)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            นำคันจิที่มีความหมายคู่ขนานหรือขั้วตรงข้ามมาคู่กัน เพื่อแสดงสเปกตรัมหรือสภาพทั้งหมด
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 明暗 (สว่าง-มืด), 高低 (สูง-ต่ำ), 勝敗 (แพ้-ชนะ), 左右 (ซ้าย-ขวา)
          </div>
        </div>

        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">3. ตัวหน้าขยายตัวหลัง (修飾・被修飾)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            คันจิตัวแรกทำหน้าที่เป็นคำคุณศัพท์ (Adjective) ขยายคำนามที่เป็นคันจิตัวหลัง
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 青空 (ท้องฟ้าสีคราม), 鉄道 (ทางรถไฟเหล็ก), 高山 (ภูเขาสูง), 急行 (ด่วน)
          </div>
        </div>

        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">4. กริยา + กรรม (動詞＋目的語)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            ตัวแรกคือกริยา ส่วนตัวหลังคือสิ่งที่ถูกกระทำ (เรียงตามไวยากรณ์จีน: Verb + Object)
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 読書 (อ่านหนังสือ), 登山 (ปีนภูเขา), 飲水 (ดื่มน้ำ), 帰国 (กลับประเทศ)
          </div>
        </div>

        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">5. คำปฏิเสธนำหน้า (否定)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            ขึ้นต้นด้วยคันจิที่มีความหมายว่า "ไม่" เช่น 不, 無, 非, 未 เพื่อกลับความหมายเป็นตรงข้าม
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 不安 (ไม่สงบ), 無理 (ไร้เหตุผล/ฝืน), 未知 (ยังไม่รู้), 非常 (ไม่ธรรมดา)
          </div>
        </div>

        <div class="detail-card" style="padding: var(--spacing-md);">
          <h3 style="font-size: 1.05rem; color: var(--color-accent); margin-bottom: 6px;">6. ประธาน + กริยา (主語＋述語)</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 8px;">
            ตัวหน้าเป็นประธาน และตัวหลังเป็นอาการกริยาหรือสภาพของประธานนั้น
          </p>
          <div style="font-size: var(--font-size-sm); background: var(--color-surface-2); padding: 8px; border-radius: 4px;">
            <strong>ตัวอย่าง:</strong> 日没 (ดวงอาทิตย์ตก), 雷鳴 (ฟ้าร้อง), 地震 (แผ่นดินไหว), 国立 (รัฐจัดตั้ง)
          </div>
        </div>

      </div>

      <!-- Special Readings Box -->
      <article class="detail-card" style="margin-bottom: var(--spacing-xl);">
        <h2 style="font-size: var(--font-size-xl); color: var(--color-accent); margin-bottom: var(--spacing-sm);">
          🗣️ กฎการอ่านแบบผสมผสานพิเศษ (重箱読み・湯桶読み)
        </h2>
        <p style="line-height: 1.8; color: var(--color-text); margin-bottom: var(--spacing-md);">
          ตามปกติแล้ว คำประสมคันจิมักอ่านด้วยเสียงองคู่กัน (音＋音) หรือเสียงคุนคู่กัน (訓＋訓) แต่ในประวัติศาสตร์ภาษาญี่ปุ่น มีคำบางกลุ่มที่ <strong>ผสมเสียงองและคุนเข้าด้วยกัน</strong>:
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-md);">
          <div style="background: var(--color-surface-2); padding: var(--spacing-md); border-radius: var(--border-radius-sm);">
            <h4 style="color: var(--color-accent); margin-bottom: 4px;">📦 重箱読み (จูบาโกะโยมิ) = 音 (On) + 訓 (Kun)</h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6;">
              ตัวหน้าอ่านเสียงอง ตัวหลังอ่านเสียงคุน
              <br><strong>ตัวอย่าง:</strong> 重箱 (じゅう・ばこ), 役場 (やく・ば), 本棚 (ほん・だな), 額縁 (がく・ぶち)
            </p>
          </div>
          <div style="background: var(--color-surface-2); padding: var(--spacing-md); border-radius: var(--border-radius-sm);">
            <h4 style="color: var(--color-accent); margin-bottom: 4px;">♨️ 湯桶読み (ยูโตะโยมิ) = 訓 (Kun) + 音 (On)</h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6;">
              ตัวหน้าอ่านเสียงคุน ตัวหลังอ่านเสียงอง
              <br><strong>ตัวอย่าง:</strong> 湯桶 (ゆ・とう), 場所 (ば・しょ), 雨具 (あま・ぐ), 荷物 (に・もつ)
            </p>
          </div>
        </div>
      </article>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
        <a href="vocabulary.html" class="action-btn" style="padding: 12px 28px; font-size: 1rem; text-decoration: none; border-radius: var(--border-radius-full); display: inline-flex; align-items: center; gap: 8px;">
          <span>📚</span> สำรวจคลังคำศัพท์และสุภาษิต 4 ตัวอักษร (四字熟語 Hub) ➔
        </a>
      </div>

    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        ข้อมูลไวยากรณ์คำประสมและเสียงอ่านพิเศษภาษาญี่ปุ่น | KanjiThai © 2026
      </div>
    </div>
  </footer>

  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
"""

with open('about-jukugo.html', 'w', encoding='utf-8') as f:
    f.write(jukugo_guide_html)
print("Created about-jukugo.html")
