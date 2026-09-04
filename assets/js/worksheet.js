/**
 * worksheet.js
 * ------------
 * Interactive Kanji Practice Worksheet Generator (kanji-worksheet.html).
 * Generates print-ready A4 practice sheets with customizable guidelines,
 * trace boxes, and readings.
 */

import { loadKanjiData } from './search.js?v=1788415658';

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
          <div class="ws-header-title">แบบฝึกคัดลายมือคันจิ (漢字練習帳)</div>
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
