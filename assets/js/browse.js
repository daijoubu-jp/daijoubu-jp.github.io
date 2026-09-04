/**
 * browse.js
 * ---------
 * Logic for the browse/catalog page (filtering, sorting, responsive grid, pagination).
 */

import { loadKanjiData, filterKanji, sortKanji } from './search.js?v=1788415658';
import { isFavorite, addFavorite, removeFavorite, getFavorites } from './storage.js?v=1788415658';

const ITEMS_PER_PAGE = 36;
let currentKanjiList = [];
let currentPage = 1;
let currentFilters = {
  q: '',
  favoritesOnly: false,
  jlpt: [],
  grade: [],
  kanken: [],
  joyoOnly: true,
  nonJoyoOnly: false,
  strokeMin: null,
  strokeMax: null,
  radical: null,
  sortBy: 'reading',
  sortOrder: 'asc'
};

/**
 * Initialize the Browse Page.
 */
export async function initBrowsePage() {
  readFiltersFromURL();
  setupFilterControls();
  setupPresetButtons();
  setupMobileDrawer();
  await applyCurrentFilters();
}

/**
 * Setup mobile collapsible filter drawer (hamburger toggle & backdrop).
 */
function setupMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-filter-toggle-btn');
  const closeBtn = document.getElementById('mobile-sidebar-close-btn');
  const sidebar = document.getElementById('filter-sidebar');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');
  const mobileResetBtn = document.getElementById('mobile-sidebar-reset-btn');
  const mobileApplyBtn = document.getElementById('mobile-sidebar-apply-btn');

  if (toggleBtn && sidebar && backdrop) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('show-mobile');
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
      sidebar.classList.remove('show-mobile');
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    if (mobileResetBtn) {
      mobileResetBtn.addEventListener('click', () => {
        document.getElementById('reset-filters-btn')?.click();
      });
    }

    if (mobileApplyBtn) {
      mobileApplyBtn.addEventListener('click', closeDrawer);
    }
  }
}

/**
 * Read filter parameters from URL query string.
 */
function readFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('preset') === 'favorites' || params.get('favorites') === 'true') {
    currentFilters.favoritesOnly = true;
  }
  if (params.has('q')) {
    currentFilters.q = params.get('q').trim();
  }
  if (params.has('jlpt')) {
    currentFilters.jlpt = params.get('jlpt').split(',').map(Number);
  }
  if (params.has('grade')) {
    currentFilters.grade = params.get('grade').split(',').map(x => (x === 'nonjoyo' ? 'nonjoyo' : Number(x)));
  }
  if (params.has('kanken')) {
    currentFilters.kanken = params.get('kanken').split(',');
  }
  if (params.has('joyo')) {
    currentFilters.joyoOnly = params.get('joyo') === 'true';
  } else if (params.get('preset') === 'all' || params.has('nonjoyo') || params.has('kanken') || params.has('grade') || params.has('jlpt')) {
    currentFilters.joyoOnly = false;
  } else {
    currentFilters.joyoOnly = true;
  }
  if (params.has('nonjoyo')) {
    currentFilters.nonJoyoOnly = params.get('nonjoyo') === 'true';
  }
  if (params.has('strokeMin')) {
    currentFilters.strokeMin = parseInt(params.get('strokeMin'), 10) || null;
  }
  if (params.has('strokeMax')) {
    currentFilters.strokeMax = parseInt(params.get('strokeMax'), 10) || null;
  }
  if (params.has('radical')) {
    currentFilters.radical = parseInt(params.get('radical'), 10) || null;
  }
  if (params.has('sort')) {
    currentFilters.sortBy = params.get('sort');
  }
  if (params.has('page')) {
    currentPage = parseInt(params.get('page'), 10) || 1;
  }
}

/**
 * Sync active filters to URL without reloading.
 */
function updateURL() {
  const params = new URLSearchParams();

  if (currentFilters.favoritesOnly) params.set('preset', 'favorites');
  if (currentFilters.q) params.set('q', currentFilters.q);
  if (currentFilters.jlpt.length) params.set('jlpt', currentFilters.jlpt.join(','));
  if (currentFilters.grade.length) params.set('grade', currentFilters.grade.join(','));
  if (currentFilters.kanken.length) params.set('kanken', currentFilters.kanken.join(','));
  if (currentFilters.joyoOnly) params.set('joyo', 'true');
  if (currentFilters.nonJoyoOnly) params.set('nonjoyo', 'true');
  if (currentFilters.strokeMin) params.set('strokeMin', currentFilters.strokeMin);
  if (currentFilters.strokeMax) params.set('strokeMax', currentFilters.strokeMax);
  if (currentFilters.radical) params.set('radical', currentFilters.radical);
  if (currentFilters.sortBy !== 'reading') params.set('sort', currentFilters.sortBy);
  if (currentPage > 1) params.set('page', currentPage);

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Setup quick filter preset buttons.
 */
function setupPresetButtons() {
  document.querySelectorAll('.filter-preset-btn').forEach(btn => {
    const preset = btn.dataset.preset;

    // Set initial active state based on current filters
    if (currentFilters.favoritesOnly && preset === 'favorites') {
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else if (currentFilters.jlpt.length === 1 && preset === `jlpt-n${currentFilters.jlpt[0]}`) {
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else if (currentFilters.joyoOnly && !currentFilters.favoritesOnly && !currentFilters.jlpt.length && !currentFilters.grade.length && !currentFilters.kanken.length && preset === 'joyo') {
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else if (!currentFilters.joyoOnly && !currentFilters.favoritesOnly && !currentFilters.jlpt.length && !currentFilters.grade.length && !currentFilters.kanken.length && !currentFilters.q && preset === 'all') {
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Reset base filters
      currentFilters.q = '';
      currentFilters.favoritesOnly = false;
      currentFilters.jlpt = [];
      currentFilters.grade = [];
      currentFilters.kanken = [];
      currentFilters.joyoOnly = false;
      currentFilters.nonJoyoOnly = false;
      currentFilters.strokeMin = null;
      currentFilters.strokeMax = null;
      currentFilters.radical = null;

      const searchInput = document.getElementById('browse-search-input');
      if (searchInput) searchInput.value = '';
      const clearBtn = document.getElementById('browse-clear-btn');
      if (clearBtn) clearBtn.classList.remove('visible');

      if (preset === 'favorites') {
        currentFilters.favoritesOnly = true;
      } else if (preset === 'joyo') {
        currentFilters.joyoOnly = true;
      } else if (preset === 'all') {
        currentFilters.joyoOnly = false;
        currentFilters.nonJoyoOnly = false;
      } else if (preset === 'elementary') {
        currentFilters.grade = [1, 2, 3, 4, 5, 6];
      } else if (preset === 'secondary') {
        currentFilters.grade = [8];
      } else if (preset === 'kanken-advanced') {
        currentFilters.kanken = ['jun1', '1'];
      } else if (preset === 'jlpt-n5') {
        currentFilters.jlpt = [5];
      } else if (preset === 'jlpt-n4') {
        currentFilters.jlpt = [4];
      } else if (preset === 'jlpt-n3') {
        currentFilters.jlpt = [3];
      } else if (preset === 'jlpt-n2') {
        currentFilters.jlpt = [2];
      } else if (preset === 'jlpt-n1') {
        currentFilters.jlpt = [1];
      }

      syncControlsWithState();
      currentPage = 1;
      applyCurrentFilters();
    });
  });
}

/**
 * Synchronize UI inputs with current filter state.
 */
function syncControlsWithState() {
  // JLPT
  document.querySelectorAll('input[name="filter-jlpt"]').forEach(cb => {
    cb.checked = currentFilters.jlpt.includes(Number(cb.value));
  });

  // Grade
  document.querySelectorAll('input[name="filter-grade"]').forEach(cb => {
    const val = cb.value === 'nonjoyo' ? 'nonjoyo' : Number(cb.value);
    cb.checked = currentFilters.grade.includes(val);
  });

  // Kanken
  document.querySelectorAll('input[name="filter-kanken"]').forEach(cb => {
    cb.checked = currentFilters.kanken.includes(cb.value);
  });

  // Joyo / Non-Joyo
  const joyoCb = document.getElementById('filter-joyo-only');
  if (joyoCb) joyoCb.checked = currentFilters.joyoOnly;

  const nonJoyoCb = document.getElementById('filter-nonjoyo-only');
  if (nonJoyoCb) nonJoyoCb.checked = currentFilters.nonJoyoOnly;

  // Strokes
  const minInput = document.getElementById('filter-stroke-min');
  if (minInput) minInput.value = currentFilters.strokeMin || '';

  const maxInput = document.getElementById('filter-stroke-max');
  if (maxInput) maxInput.value = currentFilters.strokeMax || '';

  // Radical
  const radicalSelect = document.getElementById('filter-radical');
  if (radicalSelect) radicalSelect.value = currentFilters.radical ? String(currentFilters.radical) : '';

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = currentFilters.sortBy || 'reading';
}

/**
 * Wire up UI controls (checkboxes, select, search input).
 */
function setupFilterControls() {
  // Inline Browse Search Input & Clear button
  const searchInput = document.getElementById('browse-search-input');
  const clearBtn = document.getElementById('browse-clear-btn');
  if (searchInput) {
    searchInput.value = currentFilters.q || '';
    if (clearBtn) clearBtn.classList.toggle('visible', Boolean(currentFilters.q));

    let debounceTimer = null;
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      if (clearBtn) clearBtn.classList.toggle('visible', val.length > 0);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.q = val;
        currentPage = 1;
        applyCurrentFilters();
      }, 200);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        currentFilters.q = '';
        currentPage = 1;
        applyCurrentFilters();
        searchInput.focus();
      });
    }
  }

  // JLPT Checkboxes
  document.querySelectorAll('input[name="filter-jlpt"]').forEach(cb => {
    cb.checked = currentFilters.jlpt.includes(Number(cb.value));
    cb.addEventListener('change', () => {
      const val = Number(cb.value);
      if (cb.checked) {
        if (!currentFilters.jlpt.includes(val)) currentFilters.jlpt.push(val);
      } else {
        currentFilters.jlpt = currentFilters.jlpt.filter(x => x !== val);
      }
      currentPage = 1;
      applyCurrentFilters();
    });
  });

  // Grade Checkboxes
  document.querySelectorAll('input[name="filter-grade"]').forEach(cb => {
    const val = cb.value === 'nonjoyo' ? 'nonjoyo' : Number(cb.value);
    cb.checked = currentFilters.grade.includes(val);
    cb.addEventListener('change', () => {
      if (cb.checked) {
        if (!currentFilters.grade.includes(val)) currentFilters.grade.push(val);
      } else {
        currentFilters.grade = currentFilters.grade.filter(x => x !== val);
      }
      currentPage = 1;
      applyCurrentFilters();
    });
  });

  // Kanken Checkboxes
  document.querySelectorAll('input[name="filter-kanken"]').forEach(cb => {
    cb.checked = currentFilters.kanken.includes(cb.value);
    cb.addEventListener('change', () => {
      const val = cb.value;
      if (cb.checked) {
        if (!currentFilters.kanken.includes(val)) currentFilters.kanken.push(val);
      } else {
        currentFilters.kanken = currentFilters.kanken.filter(x => x !== val);
      }
      currentPage = 1;
      applyCurrentFilters();
    });
  });

  // Joyo Only Checkbox
  const joyoCb = document.getElementById('filter-joyo-only');
  if (joyoCb) {
    joyoCb.checked = currentFilters.joyoOnly;
    joyoCb.addEventListener('change', () => {
      currentFilters.joyoOnly = joyoCb.checked;
      if (joyoCb.checked && currentFilters.nonJoyoOnly) {
        currentFilters.nonJoyoOnly = false;
        const nonJoyoCb = document.getElementById('filter-nonjoyo-only');
        if (nonJoyoCb) nonJoyoCb.checked = false;
      }
      currentPage = 1;
      applyCurrentFilters();
    });
  }

  // Non-Joyo Only Checkbox
  const nonJoyoCb = document.getElementById('filter-nonjoyo-only');
  if (nonJoyoCb) {
    nonJoyoCb.checked = currentFilters.nonJoyoOnly;
    nonJoyoCb.addEventListener('change', () => {
      currentFilters.nonJoyoOnly = nonJoyoCb.checked;
      if (nonJoyoCb.checked && currentFilters.joyoOnly) {
        currentFilters.joyoOnly = false;
        const jCb = document.getElementById('filter-joyo-only');
        if (jCb) jCb.checked = false;
      }
      currentPage = 1;
      applyCurrentFilters();
    });
  }

  // Stroke range inputs with live debounced input and change handling
  const minStrokeInput = document.getElementById('filter-stroke-min');
  const maxStrokeInput = document.getElementById('filter-stroke-max');

  let strokeDebounce = null;
  const updateStrokeFilters = () => {
    clearTimeout(strokeDebounce);
    strokeDebounce = setTimeout(() => {
      const minVal = minStrokeInput && minStrokeInput.value ? parseInt(minStrokeInput.value, 10) : null;
      const maxVal = maxStrokeInput && maxStrokeInput.value ? parseInt(maxStrokeInput.value, 10) : null;
      currentFilters.strokeMin = (minVal && minVal > 0) ? minVal : null;
      currentFilters.strokeMax = (maxVal && maxVal > 0) ? maxVal : null;
      currentPage = 1;
      applyCurrentFilters();
    }, 300);
  };

  if (minStrokeInput) {
    minStrokeInput.value = currentFilters.strokeMin || '';
    minStrokeInput.addEventListener('input', updateStrokeFilters);
    minStrokeInput.addEventListener('change', updateStrokeFilters);
  }

  if (maxStrokeInput) {
    maxStrokeInput.value = currentFilters.strokeMax || '';
    maxStrokeInput.addEventListener('input', updateStrokeFilters);
    maxStrokeInput.addEventListener('change', updateStrokeFilters);
  }

  // Radical Select Dropdown
  const radicalSelect = document.getElementById('filter-radical');
  if (radicalSelect) {
    radicalSelect.value = currentFilters.radical ? String(currentFilters.radical) : '';
    radicalSelect.addEventListener('change', () => {
      const val = parseInt(radicalSelect.value, 10);
      currentFilters.radical = val > 0 ? val : null;
      currentPage = 1;
      applyCurrentFilters();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = currentFilters.sortBy || 'reading';
    sortSelect.addEventListener('change', () => {
      currentFilters.sortBy = sortSelect.value;
      applyCurrentFilters();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        q: '',
        favoritesOnly: false,
        jlpt: [],
        grade: [],
        kanken: [],
        joyoOnly: true,
        nonJoyoOnly: false,
        strokeMin: null,
        strokeMax: null,
        radical: null,
        sortBy: 'reading',
        sortOrder: 'asc'
      };
      if (searchInput) searchInput.value = '';
      syncControlsWithState();
      document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === 'joyo'));
      currentPage = 1;
      applyCurrentFilters();
    });
  }
}

/**
 * Render active filter tags bar with removable chips.
 */
function renderActiveFilterTags() {
  const container = document.getElementById('active-filter-tags');
  const badgeEl = document.getElementById('mobile-filter-badge');

  const tags = [];

  if (currentFilters.favoritesOnly) {
    tags.push({ 
      label: `⭐ รายการโปรด (${getFavorites().length} ตัว)`, 
      clear: () => { 
        currentFilters.favoritesOnly = false; 
        document.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === 'all')); 
        currentPage = 1;
        applyCurrentFilters();
      } 
    });
  }

  if (currentFilters.q) {
    tags.push({ label: `🔍 "${currentFilters.q}"`, clear: () => { currentFilters.q = ''; const el = document.getElementById('browse-search-input'); if (el) el.value = ''; } });
  }

  if (currentFilters.joyoOnly) {
    tags.push({ label: `🌸 常用 (Joyo)`, clear: () => { currentFilters.joyoOnly = false; const el = document.getElementById('filter-joyo-only'); if (el) el.checked = false; } });
  }

  if (currentFilters.nonJoyoOnly) {
    tags.push({ label: `👑 非常用 (Non-Joyo)`, clear: () => { currentFilters.nonJoyoOnly = false; const el = document.getElementById('filter-nonjoyo-only'); if (el) el.checked = false; } });
  }

  currentFilters.jlpt.forEach(lvl => {
    tags.push({ label: `JLPT N${lvl}`, clear: () => { currentFilters.jlpt = currentFilters.jlpt.filter(x => x !== lvl); const el = document.querySelector(`input[name="filter-jlpt"][value="${lvl}"]`); if (el) el.checked = false; } });
  });

  currentFilters.grade.forEach(g => {
    const gradeLabel = g === 8 ? 'มัธยมศึกษา' : (g === 'nonjoyo' ? 'นอกเกณฑ์โจโย' : `ป.${g}`);
    tags.push({ label: `ชั้น: ${gradeLabel}`, clear: () => { currentFilters.grade = currentFilters.grade.filter(x => x !== g); const el = document.querySelector(`input[name="filter-grade"][value="${g}"]`); if (el) el.checked = false; } });
  });

  const kankenNames = { '10': '10級', '9': '9級', '8': '8級', '7': '7級', '6': '6級', '5': '5級', '4': '4級', '3': '3級', 'jun2': '準2級', '2': '2級', 'jun1': '準1級', '1': '1級' };
  currentFilters.kanken.forEach(k => {
    tags.push({ label: `漢検 ${kankenNames[k] || k}`, clear: () => { currentFilters.kanken = currentFilters.kanken.filter(x => x !== k); const el = document.querySelector(`input[name="filter-kanken"][value="${k}"]`); if (el) el.checked = false; } });
  });

  if (currentFilters.strokeMin || currentFilters.strokeMax) {
    const min = currentFilters.strokeMin || 1;
    const max = currentFilters.strokeMax || 33;
    tags.push({ label: `ขีด: ${min}–${max}`, clear: () => { currentFilters.strokeMin = null; currentFilters.strokeMax = null; const minEl = document.getElementById('filter-stroke-min'); const maxEl = document.getElementById('filter-stroke-max'); if (minEl) minEl.value = ''; if (maxEl) maxEl.value = ''; } });
  }

  if (currentFilters.radical) {
    const radEl = document.getElementById('filter-radical');
    const radText = radEl && radEl.selectedOptions[0] ? radEl.selectedOptions[0].text : `หมวด: ${currentFilters.radical}`;
    tags.push({ label: `部首: ${radText}`, clear: () => { currentFilters.radical = null; if (radEl) radEl.value = ''; } });
  }

  // Update mobile filter badge
  if (badgeEl) {
    if (tags.length > 0) {
      badgeEl.textContent = tags.length;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  if (!container) return;

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tags.map((t, idx) => `
    <span class="badge" style="background: var(--color-surface); border: 1px solid var(--color-accent); color: var(--color-accent); display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: var(--font-size-xs); cursor: pointer;" data-tag-idx="${idx}">
      ${t.label} <span style="font-weight: 700;">✕</span>
    </span>
  `).join('');

  container.querySelectorAll('[data-tag-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.tagIdx);
      if (tags[idx] && tags[idx].clear) {
        tags[idx].clear();
        currentPage = 1;
        applyCurrentFilters();
      }
    });
  });
}

/**
 * Filter, sort, and render items on page.
 */
async function applyCurrentFilters() {
  const container = document.getElementById('browse-grid');
  const countEl = document.getElementById('results-count');

  if (!container) return;

  container.innerHTML = `<div class="skeleton" style="grid-column: 1/-1; height: 200px;"></div>`;

  let filtered = await filterKanji(currentFilters);
  if (currentFilters.favoritesOnly) {
    const favs = getFavorites();
    filtered = filtered.filter(k => favs.includes(k.kanji));
  }
  currentKanjiList = sortKanji(filtered, currentFilters.sortBy, currentFilters.sortOrder);

  if (countEl) {
    const queryNote = currentFilters.q ? ` สำหรับ "${currentFilters.q}"` : '';
    const favNote = currentFilters.favoritesOnly ? ' (รายการโปรด)' : '';
    countEl.textContent = `พบ ${currentKanjiList.length.toLocaleString()} ตัวอักษร${favNote}${queryNote}`;
  }

  renderActiveFilterTags();
  updateURL();
  renderGridPage();
  renderPagination();
}

/**
 * Render the current slice of cards.
 */
function renderGridPage() {
  const container = document.getElementById('browse-grid');
  if (!container) return;

  if (currentKanjiList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${currentFilters.favoritesOnly ? '⭐' : '🔍'}</div>
        <h3>${currentFilters.favoritesOnly ? 'ยังไม่มีรายการโปรดที่บันทึกไว้' : 'ไม่พบคันจิที่ตรงกับตัวกรอง'}</h3>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto;">${currentFilters.favoritesOnly ? 'กดปุ่มดาว (☆ เพิ่มในรายการโปรด) ที่หน้ารายละเอียดคันจิ เพื่อบันทึกตัวอักษรที่คุณต้องการทบทวนไว้ที่นี่' : 'ลองปรับเปลี่ยนคำค้นหา หรือระดับ JLPT / 漢検'}</p>
        ${!currentFilters.favoritesOnly ? `
          <button type="button" id="empty-state-reset-btn" style="margin-top: 1.25rem; padding: 8px 20px; border-radius: var(--border-radius-md); background: var(--color-accent); color: #fff; border: none; cursor: pointer; font-weight: 600; font-size: var(--font-size-sm); transition: var(--transition-fast);">
            🔄 ล้างตัวกรองทั้งหมด
          </button>
        ` : ''}
      </div>
    `;

    const emptyResetBtn = document.getElementById('empty-state-reset-btn');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', () => {
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) resetBtn.click();
      });
    }
    return;
  }

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = currentKanjiList.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  container.innerHTML = pageItems.map(k => {
    const mainReading = (k.onyomi && k.onyomi[0]) || (k.kunyomi && k.kunyomi[0]) || '';
    const mainMeaningEn = (k.meanings_en && k.meanings_en[0]) || '';
    const mainMeaningTh = (k.meanings_th && k.meanings_th[0]) || '';
    const jlptBadge = k.jlpt ? `<span class="badge badge-jlpt-n${k.jlpt}">N${k.jlpt}</span>` : '';
    
    const kankenNames = { '10': '10級', '9': '9級', '8': '8級', '7': '7級', '6': '6級', '5': '5級', '4': '4級', '3': '3級', 'jun2': '準2級', '2': '2級', 'jun1': '準1級', '1': '1級' };
    const kankenLabel = k.kanken ? (kankenNames[String(k.kanken)] || `${k.kanken}級`) : '';
    const kankenBadge = kankenLabel ? `<span class="badge badge-kanken">漢検 ${kankenLabel}</span>` : '';

    return `
      <a href="kanji.html?k=${encodeURIComponent(k.kanji)}" class="kanji-card" aria-label="Kanji ${k.kanji}">
        <span class="kanji-card-char" lang="ja">${k.kanji}</span>
        <span class="kanji-card-reading" lang="ja">${mainReading}</span>
        <span class="kanji-card-meaning-th">${mainMeaningTh}</span>
        <span class="kanji-card-meaning">${mainMeaningEn}</span>
        <div class="kanji-card-badges">
          ${jlptBadge}
          ${kankenBadge}
          <span class="badge badge-strokes">${k.strokes} ขีด</span>
        </div>
      </a>
    `;
  }).join('');
}

/**
 * Render pagination buttons.
 */
function renderPagination() {
  const container = document.getElementById('browse-pagination');
  if (!container) return;

  const totalPages = Math.ceil(currentKanjiList.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // First page button
  if (currentPage > 3) {
    html += `<button class="page-btn" data-page="1" title="หน้าแรก">« 1</button>`;
  }
  
  // Previous button
  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹ ก่อนหน้า</button>`;

  // Page Numbers with smart ellipsis
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span style="padding: 0 4px; color: var(--color-text-muted);">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span style="padding: 0 4px; color: var(--color-text-muted);">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">ถัดไป ›</button>`;

  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page && page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        const countEl = document.getElementById('results-count') || document.getElementById('browse-grid');
        if (countEl) {
          const y = countEl.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        applyCurrentFilters();
      }
    });
  });
}
