/**
 * kanji-detail.js
 * ---------------
 * Renders the rich kanji detail view, stroke order SVG animation, readings,
 * Thai/EN meanings, compound words (Bunkacho 語例), Kangxi traditional variants,
 * Bunkacho 2016 handwriting notes, sequential navigation, stroke controllers,
 * grid guidelines, TTS audio, furigana toggle, and Anki export.
 */

import { getKanji, getKanjiByCodepoint, loadKanjiData } from './search.js';
import { isFavorite, addFavorite, removeFavorite } from './storage.js';

let strokeState = {
  container: null,
  paths: [],
  lengths: [],
  currentIdx: 0,
  isPlaying: false
};

export async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const kanjiChar = params.get('k');
  const codepoint = params.get('id');

  let kanji = null;
  if (kanjiChar) {
    kanji = await getKanji(kanjiChar);
  } else if (codepoint) {
    kanji = await getKanjiByCodepoint(codepoint);
  }

  if (!kanji) {
    renderNotFound();
    return;
  }

  document.title = `${kanji.kanji} - พจนานุกรมคันจิสำหรับคนไทย (Kanji Dictionary)`;
  
  await setupBreadcrumbsAndSeqNav(kanji);
  renderHero(kanji);
  renderReadings(kanji);
  renderOrigin(kanji);
  renderMeanings(kanji);
  renderMeta(kanji);
  renderHandwritingTip(kanji);
  renderExamples(kanji);
  renderRelated(kanji);
  initGuidelineControls();
  initStrokeControllers();
  initFuriganaToggle();
  initAnkiExport(kanji);
  initAudioDelegation();
  loadStrokeOrder(kanji);
}

function renderNotFound() {
  const container = document.getElementById('detail-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 5rem 1rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h2>ไม่พบคันจิที่ระบุ</h2>
        <p style="color: var(--color-text-muted);">กรุณากลับไปหน้าค้นหาเพื่อเลือกตัวอักษรอื่น</p>
        <a href="browse.html" class="action-btn" style="margin-top: 1rem; display: inline-flex;">ดูรายการคันจิทั้งหมด</a>
      </div>
    `;
  }
}

async function setupBreadcrumbsAndSeqNav(kanji) {
  const breadcrumbLevel = document.getElementById('breadcrumb-level');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const prevBtn = document.getElementById('prev-kanji-btn');
  const nextBtn = document.getElementById('next-kanji-btn');
  const prevChar = document.getElementById('prev-kanji-char');
  const nextChar = document.getElementById('next-kanji-char');

  if (breadcrumbCurrent) breadcrumbCurrent.textContent = kanji.kanji;
  if (breadcrumbLevel) {
    if (kanji.jlpt) {
      breadcrumbLevel.innerHTML = `<a href="browse.html?jlpt=${kanji.jlpt}">JLPT N${kanji.jlpt}</a>`;
    } else if (kanji.grade) {
      breadcrumbLevel.innerHTML = `<a href="browse.html?grade=${kanji.grade}">ประถมศึกษาปีที่ ${kanji.grade}</a>`;
    } else {
      breadcrumbLevel.innerHTML = `<a href="browse.html">ทั่วไป</a>`;
    }
  }

  const allKanji = await loadKanjiData();
  const currentIndex = allKanji.findIndex(k => k.kanji === kanji.kanji);

  if (currentIndex > 0) {
    const prevKanji = allKanji[currentIndex - 1];
    if (prevBtn) {
      prevBtn.href = `kanji.html?k=${encodeURIComponent(prevKanji.kanji)}`;
      prevBtn.setAttribute('aria-disabled', 'false');
      prevBtn.classList.remove('disabled');
    }
    if (prevChar) prevChar.textContent = prevKanji.kanji;
  } else if (prevBtn) {
    prevBtn.removeAttribute('href');
    prevBtn.setAttribute('aria-disabled', 'true');
    prevBtn.classList.add('disabled');
    if (prevChar) prevChar.textContent = '';
  }

  if (currentIndex >= 0 && currentIndex < allKanji.length - 1) {
    const nextKanji = allKanji[currentIndex + 1];
    if (nextBtn) {
      nextBtn.href = `kanji.html?k=${encodeURIComponent(nextKanji.kanji)}`;
      nextBtn.setAttribute('aria-disabled', 'false');
      nextBtn.classList.remove('disabled');
    }
    if (nextChar) nextChar.textContent = nextKanji.kanji;
  } else if (nextBtn) {
    nextBtn.removeAttribute('href');
    nextBtn.setAttribute('aria-disabled', 'true');
    nextBtn.classList.add('disabled');
    if (nextChar) nextChar.textContent = '';
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('stroke-modal');
    if (modal && modal.style.display === 'flex') return;
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.key === 'ArrowLeft' && prevBtn && prevBtn.getAttribute('aria-disabled') !== 'true' && prevBtn.href) {
      window.location.href = prevBtn.href;
    } else if (e.key === 'ArrowRight' && nextBtn && nextBtn.getAttribute('aria-disabled') !== 'true' && nextBtn.href) {
      window.location.href = nextBtn.href;
    }
  });
}

function renderHero(kanji) {
  const charEl = document.getElementById('detail-kanji-char');
  if (charEl) charEl.textContent = kanji.kanji;

  const favBtn = document.getElementById('favorite-btn');
  if (favBtn) {
    updateFavButtonState(favBtn, kanji.kanji);
    favBtn.addEventListener('click', () => {
      if (isFavorite(kanji.kanji)) {
        removeFavorite(kanji.kanji);
      } else {
        addFavorite(kanji.kanji);
      }
      updateFavButtonState(favBtn, kanji.kanji);
    });
  }

  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `คันจิ ${kanji.kanji} - พจนานุกรมคันจิไทย-ญี่ปุ่น`,
            url: window.location.href
          });
        } catch {}
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!');
      }
    });
  }

  const replayBtn = document.getElementById('replay-stroke-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      replayStrokeOrder();
    });
  }

  // Enlarge Button & Modal Logic
  const enlargeBtn = document.getElementById('enlarge-stroke-btn');
  const modal = document.getElementById('stroke-modal');
  const modalView = document.getElementById('stroke-modal-view');
  const closeModalBtn = document.getElementById('close-stroke-modal');
  const modalReplayBtn = document.getElementById('modal-replay-btn');
  const modalSpeedInput = document.getElementById('modal-speed-input');
  const modalPauseInput = document.getElementById('modal-pause-input');
  const modalSpeedVal = document.getElementById('modal-speed-val');
  const modalPauseVal = document.getElementById('modal-pause-val');

  const speedInput = document.getElementById('stroke-speed-input');
  const pauseInput = document.getElementById('stroke-pause-input');
  const speedVal = document.getElementById('stroke-speed-val');
  const pauseVal = document.getElementById('stroke-pause-val');

  const closeModal = () => {
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => modal.style.display = 'none', 300);
    document.body.style.overflow = '';
  };

  if (enlargeBtn && modal && modalView) {
    enlargeBtn.addEventListener('click', () => {
      const mainContainer = document.getElementById('stroke-order-view');
      modalView.innerHTML = mainContainer.innerHTML;
      
      // Sync guideline class
      const savedGuide = localStorage.getItem('kanji-guideline') || 'none';
      modalView.classList.remove('grid-cross', 'grid-star');
      if (savedGuide === 'cross') modalView.classList.add('grid-cross');
      if (savedGuide === 'star') modalView.classList.add('grid-star');

      // Sync main sliders to modal sliders
      if (modalSpeedInput && speedInput) {
        modalSpeedInput.value = speedInput.value;
        if (modalSpeedVal) modalSpeedVal.textContent = parseFloat(speedInput.value).toFixed(2) + 's';
      }
      if (modalPauseInput && pauseInput) {
        modalPauseInput.value = pauseInput.value;
        if (modalPauseVal) modalPauseVal.textContent = parseFloat(pauseInput.value).toFixed(2) + 's';
      }

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(() => modal.style.opacity = '1', 10);
      
      animateSvgPaths(modalView);
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });

    if (modalReplayBtn) {
      modalReplayBtn.addEventListener('click', () => {
        animateSvgPaths(modalView);
      });
    }

    if (modalSpeedInput) {
      modalSpeedInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(2) + 's';
        if (modalSpeedVal) modalSpeedVal.textContent = val;
        if (speedInput) speedInput.value = e.target.value;
        if (speedVal) speedVal.textContent = val;
      });
      modalSpeedInput.addEventListener('change', () => {
        animateSvgPaths(modalView);
      });
    }

    if (modalPauseInput) {
      modalPauseInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(2) + 's';
        if (modalPauseVal) modalPauseVal.textContent = val;
        if (pauseInput) pauseInput.value = e.target.value;
        if (pauseVal) pauseVal.textContent = val;
      });
      modalPauseInput.addEventListener('change', () => {
        animateSvgPaths(modalView);
      });
    }
  }

  // Main Page Stroke Settings Logic
  if (speedInput && speedVal) {
    speedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value).toFixed(2) + 's';
      speedVal.textContent = val;
      if (modalSpeedInput) modalSpeedInput.value = e.target.value;
      if (modalSpeedVal) modalSpeedVal.textContent = val;
    });
    speedInput.addEventListener('change', () => {
      replayStrokeOrder();
      if (modal && modal.style.display === 'flex') animateSvgPaths(modalView);
    });
  }

  if (pauseInput && pauseVal) {
    pauseInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value).toFixed(2) + 's';
      pauseVal.textContent = val;
      if (modalPauseInput) modalPauseInput.value = e.target.value;
      if (modalPauseVal) modalPauseVal.textContent = val;
    });
    pauseInput.addEventListener('change', () => {
      replayStrokeOrder();
      if (modal && modal.style.display === 'flex') animateSvgPaths(modalView);
    });
  }
}

export function showToast(message, icon = '✓') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  if (msgEl) msgEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;

  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function updateFavButtonState(btn, char) {
  const fav = isFavorite(char);
  btn.classList.toggle('active', fav);
  btn.innerHTML = fav ? '<span>★</span> บันทึกแล้ว' : '<span>☆</span> เพิ่มในรายการโปรด';
}

function cleanReadingForSpeech(str) {
  return (str || '').replace(/[.・]/g, '');
}

function renderReadings(kanji) {
  const onyomiList = document.getElementById('detail-onyomi');
  const kunyomiList = document.getElementById('detail-kunyomi');
  const nanoriList = document.getElementById('detail-nanori');

  // Onyomi (Joyo + Hyougai)
  if (onyomiList) {
    const joyoPills = (kanji.onyomi || []).map(r => `
      <span class="reading-pill" title="เสียงอ่านในตาราง常用漢字 (Joyo)">
        ${r} <button type="button" class="audio-btn" data-tts="${cleanReadingForSpeech(r)}" title="ฟังเสียงอ่าน ${r}" aria-label="ฟังเสียงอ่าน ${r}">🔊</button>
      </span>
    `);
    const hyougaiPills = (kanji.onyomi_hyougai || []).map(r => `
      <span class="reading-pill reading-pill-hyougai" title="เสียงอ่านนอกตาราง (表外音読み)">
        ${r} <span class="hyougai-tag">表外</span> <button type="button" class="audio-btn" data-tts="${cleanReadingForSpeech(r)}" title="ฟังเสียงอ่าน ${r}" aria-label="ฟังเสียงอ่าน ${r}">🔊</button>
      </span>
    `);
    const allPills = [...joyoPills, ...hyougaiPills];

    onyomiList.innerHTML = allPills.length
      ? allPills.join('')
      : '<span style="color: var(--color-text-muted); font-size: var(--font-size-sm);">-</span>';
  }

  // Kunyomi (Joyo + Hyougai)
  if (kunyomiList) {
    const joyoPills = (kanji.kunyomi || []).map(r => `
      <span class="reading-pill" title="เสียงอ่านในตาราง常用漢字 (Joyo)">
        ${r} <button type="button" class="audio-btn" data-tts="${cleanReadingForSpeech(r)}" title="ฟังเสียงอ่าน ${r}" aria-label="ฟังเสียงอ่าน ${r}">🔊</button>
      </span>
    `);
    const hyougaiPills = (kanji.kunyomi_hyougai || []).map(r => `
      <span class="reading-pill reading-pill-hyougai" title="เสียงอ่านนอกตาราง (表外訓読み)">
        ${r} <span class="hyougai-tag">表外</span> <button type="button" class="audio-btn" data-tts="${cleanReadingForSpeech(r)}" title="ฟังเสียงอ่าน ${r}" aria-label="ฟังเสียงอ่าน ${r}">🔊</button>
      </span>
    `);
    const allPills = [...joyoPills, ...hyougaiPills];

    kunyomiList.innerHTML = allPills.length
      ? allPills.join('')
      : '<span style="color: var(--color-text-muted); font-size: var(--font-size-sm);">-</span>';
  }

  // Nanori (Name readings)
  if (nanoriList) {
    nanoriList.innerHTML = (kanji.nanori && kanji.nanori.length)
      ? kanji.nanori.map(r => `
        <span class="reading-pill">
          ${r} <button type="button" class="audio-btn" data-tts="${cleanReadingForSpeech(r)}" title="ฟังเสียงอ่าน ${r}" aria-label="ฟังเสียงอ่าน ${r}">🔊</button>
        </span>
      `).join('')
      : '<span style="color: var(--color-text-muted); font-size: var(--font-size-sm);">-</span>';
  }
}

function renderMeanings(kanji) {
  const thContainer = document.getElementById('detail-meanings-th');
  const enContainer = document.getElementById('detail-meanings-en');

  if (thContainer) {
    thContainer.innerHTML = (kanji.meanings_th && kanji.meanings_th.length)
      ? `<div style="font-size: 1.25rem; font-weight: 600; color: var(--color-accent); font-family: var(--font-thai);">
           ${kanji.meanings_th.join(', ')}
         </div>`
      : '<div style="color: var(--color-text-muted);">-</div>';
  }

  if (enContainer) {
    enContainer.innerHTML = (kanji.meanings_en && kanji.meanings_en.length)
      ? `<div style="font-size: 1.05rem; color: var(--color-text);">
           ${kanji.meanings_en.join(', ')}
         </div>`
      : '<div style="color: var(--color-text-muted);">-</div>';
  }
}

let originsCache = null;

async function loadOriginsData() {
  if (originsCache) return originsCache;
  try {
    const res = await fetch('./data/kanji-origins.json?v=1788444334');
    if (res.ok) {
      originsCache = await res.json();
    } else {
      originsCache = {};
    }
  } catch {
    originsCache = {};
  }
  return originsCache;
}

async function renderOrigin(kanji) {
  const container = document.getElementById('detail-origin');
  if (!container) return;

  const origins = await loadOriginsData();
  let origin = origins[kanji.kanji];

  if (!origin) {
    const isRadicalItself = kanji.kanji === kanji.radicalChar;
    const meaning = (kanji.meanings_th && kanji.meanings_th[0]) || (kanji.meanings_en && kanji.meanings_en[0]) || '';
    
    if (isRadicalItself) {
      origin = {
        type: "象形文字",
        type_th: "อักษรภาพเลียนรูปทรง",
        desc: `เป็นตัวอักษรหมวดดั้งเดิม (部首: ${kanji.radicalChar}) ที่มีพัฒนาการมาจากภาพสเกตช์ลายเส้นของสิ่งของหรือปรากฏการณ์ธรรมชาติในยุคโบราณ (${meaning}) ก่อนจะวิวัฒนาการสัณฐานสู่ตัวอักษรมาตรฐานในปัจจุบัน`,
        components: [
          { part: kanji.radicalChar, role: "หมวดอักษรหลัก (部首)", desc: meaning || "รากศัพท์ดั้งเดิม" }
        ]
      };
    } else {
      origin = {
        type: "形声文字",
        type_th: "อักษรประสมเสียงและความหมาย",
        desc: `จัดอยู่ในกลุ่มอักษรประสมเสียงและความหมาย โดยมีหมวดอักษร ${kanji.radicalChar || ''} (#${kanji.radical || ''}) ทำหน้าที่เป็นส่วนบ่งชี้ความหมาย (意符) ที่สื่อถึงหมวดหมู่ และมีองค์ประกอบร่วมทำหน้าที่ช่วยกำหนดเสียงอ่าน (音符) หรือรูปองค์ประกอบย่อย`,
        components: [
          { part: kanji.radicalChar || "部", role: "意符 (ส่วนบอกความหมาย)", desc: `หมวดอักษรหลัก ${kanji.radicalChar || ''}` }
        ]
      };
    }
  }

  const compHtml = origin.components && origin.components.length ? `
    <div class="origin-components">
      <div class="origin-comp-title">โครงสร้างและองค์ประกอบ (構成要素):</div>
      <div class="origin-comp-list">
        ${origin.components.map(c => {
          const isKanjiChar = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(c.part);
          const charHtml = isKanjiChar 
            ? `<a href="kanji.html?k=${encodeURIComponent(c.part)}" class="origin-comp-link" title="ดูข้อมูลคันจิ ${c.part}"><span class="origin-comp-char">${c.part}</span></a>`
            : `<span class="origin-comp-char">${c.part}</span>`;
          return `
            <div class="origin-comp-pill">
              ${charHtml}
              <span class="origin-comp-role">${c.role}: ${c.desc}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="origin-box">
      <div class="origin-badge-wrapper">
        <span class="origin-type-badge">
          <span>📜</span> ${origin.type}
        </span>
        <span class="origin-type-sub">(${origin.type_th})</span>
      </div>
      <p class="origin-desc">
        ${origin.desc}
      </p>
      ${compHtml}
    </div>
  `;
}

function renderMeta(kanji) {
  const container = document.getElementById('detail-meta-grid');
  if (!container) return;

  const kankenNames = {
    '10': '10級', '9': '9級', '8': '8級', '7': '7級',
    '6': '6級', '5': '5級', '4': '4級', '3': '3級',
    'jun2': '準2級', '2': '2級', 'jun1': '準1級', '1': '1級'
  };
  const kankenDisplay = kanji.kanken ? (kankenNames[String(kanji.kanken)] || `${kanji.kanken}級`) : '-';

  const gradeDisplay = kanji.grade 
    ? `ป.${kanji.grade}` 
    : (kanji.joyo ? 'มัธยมศึกษา (常用)' : (kanji.kanken === 'jun1' ? 'นอกเกณฑ์โจโย (準1級)' : 'นอกเกณฑ์โจโย (1級)'));

  const tradForm = kanji.traditionalForm ? `
    <div class="meta-item" style="border: 1px solid var(--color-accent);">
      <div class="meta-item-label">ตัวเต็ม (康熙字典体)</div>
      <div class="meta-item-value" style="font-family: var(--font-display-jp); font-size: 1.5rem; color: var(--color-accent);">${kanji.traditionalForm}</div>
    </div>
  ` : '';

  const jlptBadge = kanji.jlpt 
    ? `<span class="badge badge--jlpt badge--jlpt-n${kanji.jlpt}">N${kanji.jlpt}</span>` 
    : '-';

  const kankenBadge = kanji.kanken 
    ? `<span class="badge badge--kanken">${kankenDisplay}</span>` 
    : '-';

  const gradeBadge = `<span class="badge badge--grade">${gradeDisplay}</span>`;

  const radicalLink = kanji.radical 
    ? `<a href="radicals.html#rad-${kanji.radical}" class="meta-radical-link" title="ดูรายละเอียดหมวดอักษร #${kanji.radical}">${kanji.radicalChar || ''} (#${kanji.radical})</a>`
    : (kanji.radicalChar || '-');

  container.innerHTML = `
    <div class="meta-item">
      <div class="meta-item-label">จำนวนขีด</div>
      <div class="meta-item-value">${kanji.strokes || '-'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">ระดับ JLPT</div>
      <div class="meta-item-value">${jlptBadge}</div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">ระดับ Kanji Kentei</div>
      <div class="meta-item-value">${kankenBadge}</div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">ระดับชั้นเรียน</div>
      <div class="meta-item-value">${gradeBadge}</div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">หมวดอักษร (Radical)</div>
      <div class="meta-item-value">${radicalLink}</div>
    </div>
    <div class="meta-item">
      <div class="meta-item-label">รหัส Unicode</div>
      <div class="meta-item-value">U+${kanji.codepoint || ''}</div>
    </div>
    ${tradForm}
  `;
}

function renderHandwritingTip(kanji) {
  const container = document.getElementById('detail-handwriting-tip');
  if (!container) return;

  if (kanji.handwritingTip) {
    container.style.display = 'block';
    container.innerHTML = `
      <div style="background: var(--color-surface-2); border-left: 4px solid var(--color-accent); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--border-radius-sm); font-size: var(--font-size-sm);">
        <strong>✍️ ข้อแนะนำการเขียนลายมือ (文化庁 指針):</strong><br>
        ${kanji.handwritingTip}
        <div style="margin-top: 4px;">
          <a href="handwriting-guide.html" style="font-size: var(--font-size-xs); color: var(--color-accent);">อ่านคู่มือลักษณะตัวอักษรและลายมือฉบับเต็ม →</a>
        </div>
      </div>
    `;
  } else {
    container.style.display = 'none';
  }
}

function formatVocabWord(word) {
  if (!word) return '';
  return Array.from(word).map(char => {
    if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(char)) {
      return `<a href="kanji.html?k=${encodeURIComponent(char)}" class="vocab-kanji-link" title="ดูข้อมูลคันจิ ${char}">${char}</a>`;
    }
    return char;
  }).join('');
}

function renderExamples(kanji) {
  const container = document.getElementById('detail-examples');
  if (!container) return;

  if (!kanji.examples || kanji.examples.length === 0) {
    container.innerHTML = `<p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">ไม่มีข้อมูลคำศัพท์ตัวอย่าง</p>`;
    return;
  }

  container.innerHTML = `
    <div class="vocab-list">
      ${kanji.examples.map(ex => {
        const speechWord = ex.reading ? ex.reading.split('/')[0].trim() : ex.word;
        return `
          <div class="vocab-item">
            <div class="vocab-jp">
              <span class="vocab-word">
                ${formatVocabWord(ex.word)}
                <button type="button" class="audio-btn" data-tts="${speechWord}" title="ฟังเสียงอ่านคำศัพท์ ${ex.word}" aria-label="ฟังเสียงอ่าน ${ex.word}">🔊</button>
              </span>
              <span class="vocab-reading">${ex.reading}</span>
            </div>
            <div class="vocab-meaning">
              <div class="vocab-meaning-th">${ex.meaning_th || ''}</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">${ex.meaning_en || ''}</div>
            </div>
            ${ex.sentence_ja ? `
              <div class="vocab-sentence">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                  <span class="vocab-sentence-label">例文:</span>
                  <button type="button" class="audio-btn" data-tts="${ex.sentence_ja}" title="ฟังเสียงอ่านประโยคตัวอย่าง" aria-label="ฟังเสียงประโยค" style="font-size: 0.8rem; gap: 4px;">🔊 ฟังประโยค</button>
                </div>
                <div class="vocab-sentence-ja">${ex.sentence_ruby || ex.sentence_ja}</div>
                <div class="vocab-sentence-th">${ex.sentence_th || ''}</div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function renderRelated(kanji) {
  const container = document.getElementById('detail-related');
  if (!container) return;

  const all = await loadKanjiData();
  const related = all.filter(k => k.kanji !== kanji.kanji && (k.radical === kanji.radical || k.strokes === kanji.strokes)).slice(0, 6);

  if (related.length === 0) {
    container.innerHTML = `<p style="color: var(--color-text-muted);">ไม่มีรายการคันจิที่เกี่ยวข้อง</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
      ${related.map(k => `
        <a href="kanji.html?k=${encodeURIComponent(k.kanji)}" class="kanji-card" style="padding: var(--spacing-sm); min-width: 90px;">
          <span class="kanji-card-char" style="font-size: 2rem;">${k.kanji}</span>
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">${(k.meanings_th && k.meanings_th[0]) || (k.meanings_en && k.meanings_en[0]) || ''}</span>
        </a>
      `).join('')}
    </div>
  `;
}

/* ==========================================================================
   STROKE CONTROLLER & ANIMATION
   ========================================================================== */

function updateStrokeCounter(current, total) {
  const el = document.getElementById('stroke-counter-display');
  if (el) {
    el.textContent = total > 0 ? `ขีดที่ ${current} / ${total}` : 'ขีดที่ - / -';
  }
}

function updatePlayPauseBtn(isPlaying) {
  const btn = document.getElementById('stroke-play-pause-btn');
  if (btn) {
    btn.innerHTML = isPlaying ? '⏸' : '▶';
    btn.title = isPlaying ? 'หยุดชั่วคราว' : 'เล่นต่อ / เล่นซ้ำ';
  }
}

function renderStaticStrokes(count) {
  if (!strokeState.paths.length) return;
  strokeState.paths.forEach((p, idx) => {
    p.style.animation = 'none';
    p.style.animationPlayState = 'initial';
    const len = strokeState.lengths[idx] || 100;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = idx < count ? '0' : `${len}`;
  });
  strokeState.currentIdx = count;
  updateStrokeCounter(strokeState.currentIdx, strokeState.paths.length);
}

function startAutoPlay(fromIndex = 0) {
  if (!strokeState.paths.length) return;

  const speedInput = document.getElementById('stroke-speed-input');
  const pauseInput = document.getElementById('stroke-pause-input');
  const duration = speedInput ? parseFloat(speedInput.value) : 1.25;
  const pause = pauseInput ? parseFloat(pauseInput.value) : 1.0;

  strokeState.paths.forEach((p, idx) => {
    p.style.animation = 'none';
    p.style.animationPlayState = 'initial';
    const len = strokeState.lengths[idx] || 100;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = idx < fromIndex ? '0' : `${len}`;
  });

  if (strokeState.container) {
    void strokeState.container.offsetWidth; // Force reflow
  }

  strokeState.isPlaying = true;
  updatePlayPauseBtn(true);
  updateStrokeCounter(fromIndex > 0 ? fromIndex : 0, strokeState.paths.length);

  strokeState.paths.forEach((path, idx) => {
    if (idx < fromIndex) {
      path.style.strokeDashoffset = '0';
      return;
    }
    const offsetIndex = idx - fromIndex;
    const delay = offsetIndex * pause;
    path.style.animation = `drawStroke ${duration}s ease forwards ${delay}s`;

    path.onanimationstart = () => {
      strokeState.currentIdx = idx + 1;
      updateStrokeCounter(idx + 1, strokeState.paths.length);
    };

    if (idx === strokeState.paths.length - 1) {
      path.onanimationend = () => {
        strokeState.isPlaying = false;
        strokeState.currentIdx = strokeState.paths.length;
        updatePlayPauseBtn(false);
        updateStrokeCounter(strokeState.paths.length, strokeState.paths.length);
      };
    }
  });
}

function initStrokeControllers() {
  const prevStepBtn = document.getElementById('stroke-step-prev');
  const nextStepBtn = document.getElementById('stroke-step-next');
  const playPauseBtn = document.getElementById('stroke-play-pause-btn');

  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      if (!strokeState.paths.length) return;
      strokeState.isPlaying = false;
      updatePlayPauseBtn(false);
      const target = Math.max(0, strokeState.currentIdx - 1);
      renderStaticStrokes(target);
    });
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      if (!strokeState.paths.length) return;
      strokeState.isPlaying = false;
      updatePlayPauseBtn(false);
      const target = Math.min(strokeState.paths.length, strokeState.currentIdx + 1);
      renderStaticStrokes(target);
    });
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (!strokeState.paths.length) return;

      if (strokeState.isPlaying) {
        strokeState.paths.forEach(p => p.style.animationPlayState = 'paused');
        strokeState.isPlaying = false;
        updatePlayPauseBtn(false);
      } else {
        const anyPaused = strokeState.paths.some(p => p.style.animationPlayState === 'paused');
        if (anyPaused) {
          strokeState.paths.forEach(p => p.style.animationPlayState = 'running');
          strokeState.isPlaying = true;
          updatePlayPauseBtn(true);
        } else {
          if (strokeState.currentIdx >= strokeState.paths.length) {
            startAutoPlay(0);
          } else {
            startAutoPlay(strokeState.currentIdx);
          }
        }
      }
    });
  }
}

function animateSvgPaths(container) {
  if (!container) return;
  const paths = container.querySelectorAll('path');
  if (!paths || paths.length === 0) return;
  
  const speedInput = document.getElementById('stroke-speed-input');
  const pauseInput = document.getElementById('stroke-pause-input');
  const duration = speedInput ? parseFloat(speedInput.value) : 1.25;
  const pause = pauseInput ? parseFloat(pauseInput.value) : 1.0;

  paths.forEach((path) => {
    const length = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.animation = 'none';
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  });

  void container.offsetWidth;

  paths.forEach((path, idx) => {
    path.style.animation = `drawStroke ${duration}s ease forwards ${idx * pause}s`;
  });
}

export function replayStrokeOrder() {
  if (strokeState.paths.length) {
    startAutoPlay(0);
  } else {
    const container = document.getElementById('stroke-order-view');
    if (container) animateSvgPaths(container);
  }
}

async function loadStrokeOrder(kanji) {
  const container = document.getElementById('stroke-order-view');
  if (!container) return;

  const hex = (kanji.codepoint || '').toLowerCase().padStart(5, '0');
  const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('KanjiVG SVG not found');
    let svgText = await res.text();
    
    const svgStart = svgText.indexOf('<svg');
    if (svgStart !== -1) {
      svgText = svgText.substring(svgStart);
    }

    container.innerHTML = svgText;
    
    strokeState.container = container;
    strokeState.paths = Array.from(container.querySelectorAll('path'));
    strokeState.lengths = strokeState.paths.map(p => p.getTotalLength ? p.getTotalLength() : 100);
    strokeState.currentIdx = 0;

    startAutoPlay(0);

  } catch (err) {
    container.innerHTML = `
      <div style="font-family: var(--font-display-jp); font-size: 6rem; color: var(--color-accent); line-height: 1;">
        ${kanji.kanji}
      </div>
    `;
    updateStrokeCounter(0, 0);
  }
}

/* ==========================================================================
   GRID GUIDELINES OVERLAY
   ========================================================================== */

function initGuidelineControls() {
  const guideBtns = document.querySelectorAll('.guide-chip');
  const strokeView = document.getElementById('stroke-order-view');
  const modalView = document.getElementById('stroke-modal-view');

  const saved = localStorage.getItem('kanji-guideline') || 'none';
  setGuideline(saved);

  guideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const guide = btn.dataset.guide;
      localStorage.setItem('kanji-guideline', guide);
      setGuideline(guide);
    });
  });

  function setGuideline(guide) {
    guideBtns.forEach(b => b.classList.toggle('active', b.dataset.guide === guide));
    [strokeView, modalView].forEach(v => {
      if (!v) return;
      v.classList.remove('grid-cross', 'grid-star');
      if (guide === 'cross') v.classList.add('grid-cross');
      if (guide === 'star') v.classList.add('grid-star');
    });
  }
}

/* ==========================================================================
   WEB SPEECH API AUDIO
   ========================================================================== */

export function speakJapanese(text, targetBtn = null) {
  if (!('speechSynthesis' in window)) {
    showToast('เบราว์เซอร์ไม่รองรับการออกเสียง Web Speech API', '⚠️');
    return;
  }
  window.speechSynthesis.cancel();
  const cleanText = text.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '').replace(/[.・]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.88;

  if (targetBtn) {
    targetBtn.classList.add('playing');
    utterance.onend = () => targetBtn.classList.remove('playing');
    utterance.onerror = () => targetBtn.classList.remove('playing');
  }

  window.speechSynthesis.speak(utterance);
}

function initAudioDelegation() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.audio-btn');
    if (btn && btn.dataset.tts) {
      e.preventDefault();
      speakJapanese(btn.dataset.tts, btn);
    }
  });
}

/* ==========================================================================
   FURIGANA TOGGLE
   ========================================================================== */

function initFuriganaToggle() {
  const btn = document.getElementById('detail-furigana-btn');
  const container = document.getElementById('detail-examples');
  if (!btn) return;

  let showFurigana = localStorage.getItem('kanji-furigana') !== 'false';

  const updateFuriganaUi = () => {
    btn.classList.toggle('active', showFurigana);
    btn.innerHTML = `<span>[振]</span> ฟุริงะนะ: <strong>${showFurigana ? 'เปิด' : 'ซ่อน'}</strong>`;
    if (container) {
      container.classList.toggle('hide-furigana', !showFurigana);
    }
  };

  updateFuriganaUi();

  btn.addEventListener('click', () => {
    showFurigana = !showFurigana;
    localStorage.setItem('kanji-furigana', showFurigana);
    updateFuriganaUi();
  });
}

/* ==========================================================================
   ANKI / FLASHCARD 1-CLICK EXPORT
   ========================================================================== */

function initAnkiExport(kanji) {
  const btn = document.getElementById('anki-export-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const onyomi = (kanji.onyomi || []).join(', ') || '-';
    const kunyomi = (kanji.kunyomi || []).join(', ') || '-';
    const meanTh = (kanji.meanings_th || []).join(', ') || '-';
    const meanEn = (kanji.meanings_en || []).join(', ') || '-';
    const strokes = kanji.strokes || '-';
    const jlpt = kanji.jlpt ? `N${kanji.jlpt}` : '-';
    const radical = `${kanji.radicalChar || ''} (#${kanji.radical || '-'})`;
    
    const vocabLines = (kanji.examples || []).slice(0, 3).map(e => 
      `• ${e.word}【${e.reading}】: ${e.meaning_th || e.meaning_en}`
    ).join('\n');

    const exportText = `【漢字】 ${kanji.kanji}\n【音読み】 ${onyomi}\n【訓読み】 ${kunyomi}\n【ความหมาย】 ${meanTh} (${meanEn})\n【ระดับ】 JLPT: ${jlpt} | ขีด: ${strokes} | หมวด: ${radical}\n${vocabLines ? '【คำศัพท์ตัวอย่าง】\n' + vocabLines : ''}`;

    try {
      await navigator.clipboard.writeText(exportText);
      showToast('คัดลอกข้อมูลสรุปสำหรับการ์ด Anki เรียบร้อยแล้ว!', '📋');
    } catch (err) {
      showToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่', '⚠️');
    }
  });
}
