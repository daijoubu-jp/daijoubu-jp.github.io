/**
 * worksheet.js
 * ------------
 * Interactive Kanji Practice Worksheet Generator (kanji-worksheet.html).
 * Generates print-ready A4 practice sheets with customizable guidelines,
 * trace boxes, and readings.
 */

import { loadKanjiData, searchKanji } from './search.js';

let cachedKanji = null;

export async function initWorksheetPage() {
  cachedKanji = await loadKanjiData();

  const presetSelect = document.getElementById('ws-preset-select');
  const customInput = document.getElementById('ws-custom-input');
  const gridStyleSelect = document.getElementById('ws-grid-style');
  const traceCountSelect = document.getElementById('ws-trace-count');
  const showInfoCheckbox = document.getElementById('ws-show-info');
  const generateBtn = document.getElementById('ws-generate-btn');
  const printBtn = document.getElementById('ws-print-btn');

  // Setup Kanji Search Picker Panel
  setupKanjiPicker(customInput);

  // When preset changes, populate customInput
  if (presetSelect && customInput) {
    presetSelect.addEventListener('change', () => {
      const val = presetSelect.value;
      if (val === 'custom') {
        customInput.focus();
        return;
      }
      
      let list = [];
      if (val.startsWith('grade-')) {
        const g = parseInt(val.replace('grade-', ''), 10);
        list = cachedKanji.filter(k => k.grade === g).map(k => k.kanji);
      } else if (val.startsWith('jlpt-')) {
        const j = parseInt(val.replace('jlpt-', ''), 10);
        list = cachedKanji.filter(k => k.jlpt === j).map(k => k.kanji);
      }

      // Pick first 5-10 kanji as default sample
      customInput.value = list.slice(0, 10).join('');
      generateWorksheet();
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      generateWorksheet();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Initial generation
  generateWorksheet();
}

/**
 * Connects the Kanji Search Picker panel for easy character insertion.
 */
function setupKanjiPicker(customInput) {
  const toggleBtn = document.getElementById('ws-search-kanji-btn');
  const panel = document.getElementById('ws-kanji-picker-panel');
  const searchInput = document.getElementById('ws-picker-search-input');
  const closeBtn = document.getElementById('ws-picker-close-btn');
  const resultsContainer = document.getElementById('ws-picker-results');

  if (!toggleBtn || !panel || !searchInput) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      searchInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  let debounce = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = searchInput.value.trim();
    if (!q) {
      resultsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted); padding: 6px;">พิมพ์คำค้นหาเพื่อเริ่มค้นหาคันจิ...</span>';
      return;
    }
    debounce = setTimeout(async () => {
      const matches = await searchKanji(q, { limit: 24 });
      if (!matches || !matches.length) {
        resultsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted); padding: 6px;">ไม่พบคันจิที่ตรงกับคำค้นหา</span>';
        return;
      }
      resultsContainer.innerHTML = matches.map(k => {
        const meanTh = (k.meanings_th && k.meanings_th[0]) ? k.meanings_th[0] : (k.meanings_en?.[0] || '');
        const on = (k.onyomi && k.onyomi[0]) ? k.onyomi[0] : '';
        return `
          <button type="button" class="ws-picker-chip" data-char="${k.kanji}" title="${k.kanji}: ${meanTh} (${on})" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--border-radius-sm); background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text); font-size: 0.85rem; cursor: pointer; transition: all var(--transition-fast);">
            <strong class="kanji-text" style="font-size: 1.15rem; color: var(--color-accent);">${k.kanji}</strong>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${meanTh}</span>
          </button>
        `;
      }).join('');

      resultsContainer.querySelectorAll('.ws-picker-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const char = btn.dataset.char;
          if (customInput) {
            customInput.value = (customInput.value || '') + char;
            generateWorksheet();
          }
          btn.style.borderColor = 'var(--color-accent)';
          btn.style.backgroundColor = 'var(--color-accent-light)';
          setTimeout(() => {
            btn.style.borderColor = '';
            btn.style.backgroundColor = '';
          }, 300);
        });
      });
    }, 180);
  });
}

export function generateWorksheet() {
  const customInput = document.getElementById('ws-custom-input');
  const gridStyle = document.getElementById('ws-grid-style')?.value || 'cross';
  const traceCount = parseInt(document.getElementById('ws-trace-count')?.value || '2', 10);
  const showInfo = document.getElementById('ws-show-info')?.checked ?? true;
  const container = document.getElementById('worksheet-pages-container');

  if (!container) return;

  const rawText = (customInput?.value || '日本語漢字学習').trim();
  // Extract unique kanji or sequence
  const kanjiChars = Array.from(rawText).filter(c => /[\u4E00-\u9FAF]/.test(c));

  if (kanjiChars.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--border-radius);">
        <p style="color: var(--color-text-muted);">กรุณากรอกตัวอักษรคันจิที่ต้องการสร้างใบงาน (เช่น 日本語)</p>
      </div>
    `;
    return;
  }

  const kanjiMap = new Map();
  if (cachedKanji) {
    for (const k of cachedKanji) {
      kanjiMap.set(k.kanji, k);
    }
  }

  // 5 rows per A4 page
  const ROWS_PER_PAGE = 5;
  const TOTAL_BOXES_PER_ROW = 10;

  const pages = [];
  for (let i = 0; i < kanjiChars.length; i += ROWS_PER_PAGE) {
    pages.push(kanjiChars.slice(i, i + ROWS_PER_PAGE));
  }

  container.innerHTML = pages.map((pageChars, pageIdx) => {
    const rowsHtml = pageChars.map(char => {
      const data = kanjiMap.get(char) || {};
      const on = (data.onyomi || []).slice(0, 2).join(', ');
      const kun = (data.kunyomi || []).slice(0, 2).join(', ');
      const th = (data.meanings_th || []).slice(0, 2).join(', ');
      const strokes = data.strokes ? `${data.strokes} ขีด` : '';

      const infoHtml = showInfo ? `
        <div class="ws-row-info">
          <span class="ws-info-reading"><strong>音:</strong> ${on || '-'} | <strong>訓:</strong> ${kun || '-'}</span>
          <span class="ws-info-meaning"><strong>แปล:</strong> ${th || '-'} (${strokes})</span>
        </div>
      ` : '';

      // Generate 10 practice grid boxes
      let boxesHtml = '';
      for (let b = 0; b < TOTAL_BOXES_PER_ROW; b++) {
        let boxContent = '';
        let extraClass = '';

        if (b === 0) {
          // Model box (bold character)
          boxContent = `<span class="ws-char ws-char-model">${char}</span>`;
          extraClass = ' ws-box-model';
        } else if (b <= traceCount) {
          // Trace guideline box (light outline)
          boxContent = `<span class="ws-char ws-char-trace">${char}</span>`;
          extraClass = ' ws-box-trace';
        }

        boxesHtml += `
          <div class="ws-box ws-grid-${gridStyle}${extraClass}">
            ${boxContent}
          </div>
        `;
      }

      return `
        <div class="ws-row">
          ${infoHtml}
          <div class="ws-boxes-row">
            ${boxesHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="ws-page">
        <div class="ws-page-header">
          <div class="ws-header-titles">
            <div class="ws-header-title">แบบฝึกคัดลายมือคันจิ</div>
            <div class="ws-header-sub kanji-text">漢字練習帳</div>
          </div>
          <div class="ws-header-fields">
            <span>วันที่: ____________________</span>
            <span>ชื่อ: ____________________</span>
            <span>คะแนน: _____ / 100</span>
          </div>
        </div>

        <div class="ws-rows-container">
          ${rowsHtml}
        </div>

        <div class="ws-page-footer">
          <span>KanjiThai - แหล่งเรียนรู้คันจิออนไลน์</span>
          <span>หน้า ${pageIdx + 1} / ${pages.length}</span>
        </div>
      </section>
    `;
  }).join('');
}
