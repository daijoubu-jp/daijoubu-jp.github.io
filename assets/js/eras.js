/**
 * eras.js
 * -------
 * DOM controller for knowledge/jp-eras.html (日本の時代・年号).
 * Wires the 3-way year converter (ค.ศ. ↔ พ.ศ. ↔ ปีรัชศกญี่ปุ่น 和暦),
 * the 15-period interactive timeline & inspector, and the Gengo explorer.
 */

import { loadErasData } from './search.js';
import { speakJapanese } from './tts.js';
import {
  MACRO_ERAS,
  convertFromWesternYear,
  convertFromBuddhistYear,
  convertFromGengo,
  extractUniqueKanji,
} from './eras-core.js';

function renderKanjiLinksHtml(text) {
  const chars = extractUniqueKanji(text);
  if (chars.length === 0) return '';
  return chars
    .map(
      (ch) =>
        `<a href="../browse/kanji.html?k=${encodeURIComponent(ch)}" class="eras-kanji-pill" title="ดูข้อมูลคันจิ ${ch}">${ch}</a>`
    )
    .join('');
}

/**
 * Initialize the Eras of Japan knowledge page.
 * @returns {Promise<void>}
 */
export async function initErasPage() {
  const timelineListEl = document.getElementById('eras-timeline-list');
  const inspectorEl = document.getElementById('eras-period-inspector');
  const macroTabsEl = document.getElementById('eras-macro-tabs');
  const gengoGridEl = document.getElementById('eras-gengo-grid');
  const gengoFilterTabsEl = document.getElementById('eras-gengo-filter-tabs');

  const ceInput = document.getElementById('eras-ce-input');
  const beInput = document.getElementById('eras-be-input');
  const gengoSelect = document.getElementById('eras-gengo-select');
  const gengoYearInput = document.getElementById('eras-gengo-year-input');
  const convResultEl = document.getElementById('eras-converter-result');

  if (!timelineListEl || !inspectorEl) return;

  const erasData = await loadErasData();
  const periods = erasData.periods || [];
  const gengo = erasData.gengo || [];

  if (periods.length === 0) {
    inspectorEl.innerHTML = '<p>ไม่สามารถโหลดข้อมูลยุคสมัยได้ในขณะนี้</p>';
    return;
  }

  let activeMacro = 'all';
  let activePeriodSlug = periods[periods.length - 1].slug; // Default to Reiwa
  let activeGengoFilter = 'all';

  // --- 1. 3-Way Year Converter --------------------------------------------
  if (gengoSelect) {
    const sortedGengoDesc = [...gengo].sort((a, b) => b.start_year - a.start_year);
    gengoSelect.innerHTML = sortedGengoDesc
      .map(
        (g) =>
          `<option value="${g.id}">${g.name_ja} (${g.name_th} • ${g.start_year}–${g.end_year ?? 'ปัจจุบัน'})</option>`
      )
      .join('');
  }

  function renderConversionResult(res, source) {
    if (!res || !convResultEl) return;

    if (source !== 'ce' && ceInput) ceInput.value = String(res.ceYear);
    if (source !== 'be' && beInput) beInput.value = String(res.beYear);
    if (source !== 'gengo' && res.gengoMatches.length > 0) {
      const latestGengo = res.gengoMatches[res.gengoMatches.length - 1];
      if (gengoSelect) gengoSelect.value = latestGengo.id;
      if (gengoYearInput) gengoYearInput.value = String(latestGengo.year);
    }

    const gengoHtml =
      res.gengoMatches.length > 0
        ? res.gengoMatches
            .map(
              (m) =>
                `<div><strong>${m.labelJa}</strong> <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">(${m.labelTh})</span></div>`
            )
            .join('')
        : '<span style="color: var(--color-text-muted);">ไม่มีรัชศกในฐานข้อมูลสำหรับปีนี้</span>';

    const periodHtml =
      res.periodMatches.length > 0
        ? res.periodMatches
            .map(
              (p) =>
                `<button type="button" class="eras-preset-btn eras-jump-period" data-slug="${p.slug}" title="คลิกเพื่อดูรายละเอียด ${p.name_th}">${p.name_ja} (${p.name_th}) ↗</button>`
            )
            .join(' ')
        : '<span style="color: var(--color-text-muted);">ก่อนยุคโจมง / นอกช่วงข้อมูล</span>';

    convResultEl.innerHTML = `
      <div>
        <div class="eras-conv-box-label">คริสต์ศักราช / พุทธศักราช</div>
        <div class="eras-conv-box-val">${res.ceLabelTh}</div>
        <div class="eras-conv-box-sub">${res.beLabelTh}</div>
      </div>
      <div>
        <div class="eras-conv-box-label">ปีรัชศกญี่ปุ่น (和暦・元号)</div>
        <div class="eras-conv-box-val">${gengoHtml}</div>
      </div>
      <div>
        <div class="eras-conv-box-label">ยุคสมัยประวัติศาสตร์ (時代)</div>
        <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;">${periodHtml}</div>
      </div>
    `;

    convResultEl.querySelectorAll('.eras-jump-period').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeMacro = 'all';
        activePeriodSlug = btn.dataset.slug;
        renderMacroTabs();
        renderTimelineList();
        renderInspector();
        inspectorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  ceInput?.addEventListener('input', () => {
    const val = Number(ceInput.value);
    if (!Number.isFinite(val) || val === 0) return;
    renderConversionResult(convertFromWesternYear(val, erasData), 'ce');
  });

  beInput?.addEventListener('input', () => {
    const val = Number(beInput.value);
    if (!Number.isFinite(val)) return;
    renderConversionResult(convertFromBuddhistYear(val, erasData), 'be');
  });

  const handleGengoChange = () => {
    const gid = gengoSelect?.value;
    const gyear = Number(gengoYearInput?.value || 1);
    if (!gid) return;
    renderConversionResult(convertFromGengo(gid, gyear, erasData), 'gengo');
  };

  gengoSelect?.addEventListener('change', handleGengoChange);
  gengoYearInput?.addEventListener('input', handleGengoChange);

  document.querySelectorAll('.eras-preset-btn[data-ce]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ce = Number(btn.dataset.ce);
      renderConversionResult(convertFromWesternYear(ce, erasData), 'preset');
    });
  });

  // Initialize converter with current year 2026
  renderConversionResult(convertFromWesternYear(2026, erasData), 'init');

  // --- 2. Interactive 15-Period Timeline & Inspector ----------------------
  function renderMacroTabs() {
    if (!macroTabsEl) return;
    macroTabsEl.innerHTML = MACRO_ERAS.map(
      (m) => `
      <button type="button" class="eras-macro-tab ${m.id === activeMacro ? 'is-active' : ''}" data-macro="${m.id}">
        ${m.labelTh} (${m.labelJa})
      </button>
    `
    ).join('');

    macroTabsEl.querySelectorAll('.eras-macro-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeMacro = btn.dataset.macro;
        const visible = getVisiblePeriods();
        if (visible.length > 0 && !visible.some((p) => p.slug === activePeriodSlug)) {
          activePeriodSlug = visible[0].slug;
        }
        renderMacroTabs();
        renderTimelineList();
        renderInspector();
      });
    });
  }

  function getVisiblePeriods() {
    return activeMacro === 'all'
      ? periods
      : periods.filter((p) => p.macro_era === activeMacro);
  }

  function renderTimelineList() {
    const visible = getVisiblePeriods();
    timelineListEl.innerHTML = visible
      .map(
        (p) => `
      <button type="button" class="eras-timeline-item ${p.slug === activePeriodSlug ? 'is-active' : ''}" data-slug="${p.slug}">
        <div class="eras-tl-main">
          <span class="eras-tl-ja" lang="ja">${p.name_ja}</span>
          <span class="eras-tl-th">${p.name_th} (${p.name_romaji})</span>
        </div>
        <span class="eras-tl-years">${p.start_year < 0 ? `${Math.abs(p.start_year)} BC` : p.start_year}–${p.end_year ?? 'ปัจจุบัน'}</span>
      </button>
    `
      )
      .join('');

    timelineListEl.querySelectorAll('.eras-timeline-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePeriodSlug = btn.dataset.slug;
        renderTimelineList();
        renderInspector();
      });
    });
  }

  function renderInspector() {
    const period = periods.find((p) => p.slug === activePeriodSlug) || periods[0];
    if (!period) return;

    const relatedGengo = gengo.filter((g) => g.period_slug === period.slug);
    const relatedGengoHtml =
      relatedGengo.length > 0
        ? `<div class="eras-insp-block">
            <div class="eras-insp-block-title">🎌 รัชศกสำคัญในยุคนี้ (元号・年号)</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${relatedGengo
                .map(
                  (g) =>
                    `<span class="eras-badge">${g.name_ja} (${g.name_th} • ค.ศ. ${g.start_year}–${g.end_year ?? 'ปัจจุบัน'})</span>`
                )
                .join('')}
            </div>
          </div>`
        : '';

    inspectorEl.innerHTML = `
      <div class="eras-insp-header">
        <div>
          <div class="eras-insp-ja" lang="ja">${period.name_ja}</div>
          <div class="eras-insp-reading">
            <span>${period.name_hira} • ${period.name_romaji} • <strong>${period.name_th}</strong></span>
            <button type="button" class="audio-btn" data-tts="${period.name_hira}" title="ฟังเสียงอ่าน ${period.name_ja}" aria-label="ฟังเสียงอ่าน ${period.name_ja}">🔊</button>
          </div>
        </div>
        <div class="eras-insp-badges">
          <span class="eras-badge eras-badge--accent">${period.year_label}</span>
          <span class="eras-badge">${period.macro_era_ja} (${period.macro_era_th})</span>
        </div>
      </div>

      <div class="eras-insp-block">
        <div class="eras-insp-block-title">🏛️ ศูนย์กลางการปกครอง / ราชธานี</div>
        <div class="eras-insp-text">${period.capital}</div>
      </div>

      <div class="eras-insp-block">
        <div class="eras-insp-block-title">🌱 ที่มาและความหมายของชื่อยุค (語源・漢字の意味)</div>
        <div class="eras-insp-text">${period.etymology_th}</div>
      </div>

      <div class="eras-insp-block">
        <div class="eras-insp-block-title">📜 ภาพรวมประวัติศาสตร์และสังคม</div>
        <div class="eras-insp-text">${period.summary_th}</div>
      </div>

      <div class="eras-insp-block">
        <div class="eras-insp-block-title">✍️ พัฒนาการอักษรคันจิและภาษาเขียนในยุคนี้</div>
        <div class="eras-insp-text">${period.kanji_milestone_th}</div>
      </div>

      <div class="eras-insp-block">
        <div class="eras-insp-block-title">⭐ เหตุการณ์สำคัญประจำยุค</div>
        <ul class="eras-highlights-list">
          ${(period.highlights || []).map((h) => `<li>${h}</li>`).join('')}
        </ul>
      </div>

      ${relatedGengoHtml}

      <div>
        <div class="eras-insp-block-title">🔗 คันจิในชื่อยุคสมัย (คลิกเพื่อเปิดพจนานุกรม)</div>
        <div class="eras-kanji-pills">
          ${renderKanjiLinksHtml(period.name_ja)}
        </div>
      </div>
    `;
  }

  // --- 3. Landmark Gengo Explorer -----------------------------------------
  function renderGengoSection() {
    if (!gengoGridEl) return;

    if (gengoFilterTabsEl) {
      const filters = [
        { id: 'all', label: `ทั้งหมด (${gengo.length} รัชศก)` },
        { id: 'modern', label: 'รัชศกยุคใหม่ (明治–令和)' },
        { id: 'historical', label: 'รัชศกสำคัญในประวัติศาสตร์ (大化–慶応)' },
      ];
      gengoFilterTabsEl.innerHTML = filters
        .map(
          (f) =>
            `<button type="button" class="eras-macro-tab ${f.id === activeGengoFilter ? 'is-active' : ''}" data-gfilter="${f.id}">${f.label}</button>`
        )
        .join('');

      gengoFilterTabsEl.querySelectorAll('.eras-macro-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeGengoFilter = btn.dataset.gfilter;
          renderGengoSection();
        });
      });
    }

    const filteredGengo = gengo.filter((g) => {
      if (activeGengoFilter === 'modern') return g.is_modern;
      if (activeGengoFilter === 'historical') return !g.is_modern;
      return true;
    });

    gengoGridEl.innerHTML = filteredGengo
      .map(
        (g) => `
      <article class="eras-gengo-card">
        <div class="eras-gengo-top">
          <div>
            <span class="eras-gengo-kanji" lang="ja">${g.name_ja}</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-left: 6px;">${g.name_hira} • ${g.name_th}</span>
            <button type="button" class="audio-btn" data-tts="${g.name_hira}" title="ฟังเสียงอ่าน ${g.name_ja}" aria-label="ฟังเสียงอ่าน ${g.name_ja}">🔊</button>
          </div>
          <span class="eras-gengo-years">ค.ศ. ${g.start_year}–${g.end_year ?? 'ปัจจุบัน'}</span>
        </div>
        <div class="eras-gengo-source">📖 ที่มา (典拠): ${g.source_classic}</div>
        <p class="eras-gengo-meaning">${g.meaning_th}</p>
        <div class="eras-kanji-pills">
          ${renderKanjiLinksHtml(g.name_ja)}
        </div>
      </article>
    `
      )
      .join('');
  }

  // Delegate TTS audio buttons across the page
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.audio-btn[data-tts]');
    if (!btn) return;
    speakJapanese(btn.dataset.tts, btn);
  });

  renderMacroTabs();
  renderTimelineList();
  renderInspector();
  renderGengoSection();
}
