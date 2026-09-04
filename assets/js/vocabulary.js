/**
 * vocabulary.js
 * -------------
 * Interactive logic for the Kanji Vocabulary & Jukugo Hub (vocabulary.html).
 * Features:
 * - Real-time multilingual search (Kanji, Kana, Romaji, Thai, English)
 * - Category filter tabs (四字熟語, สัตว์, พืช, ประเทศ, อนิเมะเรื่องต่างๆ)
 * - Web Speech API Japanese text-to-speech audio pronunciation
 * - Furigana show/hide toggle with localStorage persistence
 * - Character breakdown links to individual kanji detail pages
 * - Anki/Flashcard copy to clipboard
 */

let cachedVocabulary = null;
let currentCategory = 'all';
let searchQuery = '';
let sortBy = 'default';
let showFurigana = true;

/**
 * Load vocabulary dataset.
 */
export async function loadVocabularyData() {
  if (cachedVocabulary) return cachedVocabulary;
  try {
    const dataUrl = new URL('../../data/vocabulary.json?v=1788410900', import.meta.url).href;
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    cachedVocabulary = await res.json();
  } catch (err) {
    console.error('Failed to load vocabulary.json:', err);
    cachedVocabulary = [];
  }
  return cachedVocabulary;
}

/**
 * Play Japanese speech synthesis audio.
 * @param {string} text Japanese word to speak
 * @param {HTMLElement} [btnEl] Button element for active pulse animation
 */
export function playPronunciation(text, btnEl) {
  if (!('speechSynthesis' in window)) {
    alert('เบราว์เซอร์ของคุณไม่รองรับการออกเสียง Web Speech API');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85; // Slightly slower for clarity

  if (btnEl) {
    btnEl.classList.add('active-playing');
    utterance.onend = () => btnEl.classList.remove('active-playing');
    utterance.onerror = () => btnEl.classList.remove('active-playing');
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Copy formatted vocabulary text for Anki / Notion flashcards.
 * @param {Object} item Vocabulary item
 * @param {HTMLElement} btn Button element for feedback
 */
export async function copyVocabularyItem(item, btn) {
  const text = `${item.word} [${item.reading}] - ${item.meaning_th}`;
  try {
    await navigator.clipboard.writeText(text);
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.style.color = '#10b981';
    btn.style.borderColor = '#10b981';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1500);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}

/**
 * Initialize Vocabulary Page.
 */
export async function initVocabularyPage() {
  // Load furigana preference
  const savedFurigana = localStorage.getItem('kanji-furigana');
  if (savedFurigana !== null) {
    showFurigana = savedFurigana === 'true';
  }

  const container = document.getElementById('vocab-grid');
  if (container) {
    if (!showFurigana) {
      container.classList.add('hide-furigana');
    }
  }

  // Sync Furigana Toggle Button UI
  const furiganaBtn = document.getElementById('furigana-toggle-btn');
  if (furiganaBtn) {
    furiganaBtn.classList.toggle('active', showFurigana);
    furiganaBtn.innerHTML = `<span>[振]</span> ฟุริงะนะ: <strong>${showFurigana ? 'เปิด' : 'ซ่อน'}</strong>`;
    furiganaBtn.addEventListener('click', () => {
      showFurigana = !showFurigana;
      localStorage.setItem('kanji-furigana', String(showFurigana));
      furiganaBtn.classList.toggle('active', showFurigana);
      furiganaBtn.innerHTML = `<span>[振]</span> ฟุริงะนะ: <strong>${showFurigana ? 'เปิด' : 'ซ่อน'}</strong>`;
      if (container) container.classList.toggle('hide-furigana', !showFurigana);
    });
  }

  // Setup Search Input
  const searchInput = document.getElementById('vocab-search-input');
  const clearBtn = document.getElementById('vocab-clear-btn');
  let searchTimer = null;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        if (clearBtn) clearBtn.classList.toggle('visible', !!searchQuery);
        renderFilteredVocabulary();
      }, 200);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      searchQuery = '';
      renderFilteredVocabulary();
      searchInput.focus();
    });
  }

  // Setup 2-Tier Category Filter Tabs & Chips
  function switchTier(tier, categoryToSelect = null) {
    // 1. Update Tier 1 Tabs
    document.querySelectorAll('.vocab-tier1-tab').forEach(tab => {
      const isActive = tab.dataset.tier === tier;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    // 2. Update Tier 2 Groups
    document.querySelectorAll('.vocab-tier2-group').forEach(group => {
      group.classList.toggle('active', group.dataset.tierGroup === tier);
    });

    // 3. Determine category
    let targetCat = categoryToSelect;
    if (!targetCat) {
      if (tier === 'general') targetCat = 'general-all';
      else if (tier === 'anime') targetCat = 'anime-all';
      else targetCat = 'all';
    }

    currentCategory = targetCat;

    // 4. Update active chip inside the active group
    const activeGroup = document.querySelector(`.vocab-tier2-group[data-tier-group="${tier}"]`);
    if (activeGroup) {
      activeGroup.querySelectorAll('.vocab-chip').forEach(c => c.classList.remove('active'));
      const targetChip = activeGroup.querySelector(`.vocab-chip[data-category="${targetCat}"]`) || activeGroup.querySelector('.vocab-chip');
      if (targetChip) {
        targetChip.classList.add('active');
        currentCategory = targetChip.dataset.category;
      }
    }

    renderFilteredVocabulary();
  }

  // Attach click listeners to Tier 1 tabs
  document.querySelectorAll('.vocab-tier1-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTier(tab.dataset.tier);
    });
  });

  // Attach click listeners to Tier 2 sub-chips
  document.querySelectorAll('.vocab-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const parentGroup = chip.closest('.vocab-tier2-group');
      if (parentGroup) {
        parentGroup.querySelectorAll('.vocab-chip').forEach(c => c.classList.remove('active'));
      }
      chip.classList.add('active');
      currentCategory = chip.dataset.category;
      renderFilteredVocabulary();
    });
  });

  // Setup Sort Select
  const sortSelect = document.getElementById('vocab-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortBy = sortSelect.value;
      renderFilteredVocabulary();
    });
  }

  // Read URL parameters (e.g. ?cat=animals or ?cat=anime-bleach)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    let tier = 'all';
    if (catParam.startsWith('anime')) {
      tier = 'anime';
    } else if (['general-all', 'yojijukugo', 'animals', 'plants', 'countries'].includes(catParam)) {
      tier = 'general';
    }
    switchTier(tier, catParam);
  }

  // Load Data and Render initial items
  await loadVocabularyData();
  renderFilteredVocabulary();
}

/**
 * Filter, sort, and render vocabulary cards.
 */
export async function renderFilteredVocabulary() {
  const container = document.getElementById('vocab-grid');
  const countEl = document.getElementById('vocab-results-count');
  if (!container) return;

  const allItems = await loadVocabularyData();

  // Update dynamic count badges on Tier 1 tabs
  const badgeAll = document.getElementById('badge-count-all');
  const badgeGen = document.getElementById('badge-count-general');
  const badgeAni = document.getElementById('badge-count-anime');
  if (badgeAll) badgeAll.textContent = allItems.length;
  if (badgeGen) badgeGen.textContent = allItems.filter(i => !i.category.startsWith('anime')).length;
  if (badgeAni) badgeAni.textContent = allItems.filter(i => i.category.startsWith('anime')).length;

  let filtered = allItems.filter(item => {
    // Category match
    if (currentCategory !== 'all') {
      if (currentCategory === 'general-all') {
        if (item.category.startsWith('anime')) return false;
      } else if (currentCategory === 'anime-all') {
        if (!item.category.startsWith('anime')) return false;
      } else if (currentCategory.startsWith('anime')) {
        if (item.category !== currentCategory) {
          return false;
        }
      } else if (item.category !== currentCategory) {
        return false;
      }
    }

    // Search query match
    if (searchQuery) {
      const q = searchQuery;
      const matchWord = item.word.toLowerCase().includes(q);
      const matchReading = item.reading.toLowerCase().includes(q);
      const matchRomaji = item.romaji.toLowerCase().includes(q);
      const matchMeaningTh = item.meaning_th.toLowerCase().includes(q);
      const matchMeaningEn = item.meaning_en.toLowerCase().includes(q);
      const matchSeries = item.series && item.series.toLowerCase().includes(q);
      const matchTags = item.tags && item.tags.some(t => t.toLowerCase().includes(q));

      if (!matchWord && !matchReading && !matchRomaji && !matchMeaningTh && !matchMeaningEn && !matchSeries && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // Sort logic
  if (sortBy === 'word') {
    filtered.sort((a, b) => a.reading.localeCompare(b.reading, 'ja'));
  } else if (sortBy === 'length') {
    filtered.sort((a, b) => a.word.length - b.word.length);
  }

  // Update counter
  if (countEl) {
    const queryNote = searchQuery ? ` สำหรับ "${searchQuery}"` : '';
    countEl.textContent = `พบ ${filtered.length.toLocaleString()} คำศัพท์${queryNote}`;
  }

  // Empty state
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>ไม่พบคำศัพท์ที่ตรงกับเงื่อนไขการค้นหา</h3>
        <p style="color: var(--color-text-muted); max-width: 480px; margin: 0 auto 1.5rem;">ลองเปลี่ยนคำค้นหา หรือคลิกเลือกหมวดหมู่ "🌟 ทั้งหมด" เพื่อดูคำศัพท์ทั้งหมด</p>
        <button type="button" id="vocab-reset-btn" style="padding: 8px 20px; border-radius: var(--border-radius-md); background: var(--color-accent); color: #fff; border: none; cursor: pointer; font-weight: 600;">
          🔄 แสดงคำศัพท์ทั้งหมด
        </button>
      </div>
    `;

    const resetBtn = document.getElementById('vocab-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentCategory = 'all';
        searchQuery = '';
        const searchInput = document.getElementById('vocab-search-input');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('vocab-clear-btn');
        if (clearBtn) clearBtn.classList.remove('visible');
        document.querySelectorAll('.vocab-chip').forEach(c => c.classList.toggle('active', c.dataset.category === 'all'));
        renderFilteredVocabulary();
      });
    }
    return;
  }

  // Render cards
  container.innerHTML = filtered.map(item => {
    // Badges
    let animeBadge = '';
    if (item.series) {
      let seriesClass = 'anime-badge';
      if (item.category === 'anime-bleach') seriesClass += ' anime-badge--bleach';
      else if (item.category === 'anime-naruto') seriesClass += ' anime-badge--naruto';
      else if (item.category === 'anime-kny') seriesClass += ' anime-badge--kny';
      else if (item.category === 'anime-jjk') seriesClass += ' anime-badge--jjk';

      animeBadge = `<span class="${seriesClass}">${item.series}</span>`;
    }

    const categoryBadge = `<span class="vocab-category-badge">${item.category_th}</span>`;

    // Literal Breakdown Chips
    const breakdownHtml = item.literal_breakdown && item.literal_breakdown.length ? `
      <div class="vocab-breakdown">
        <div class="vocab-breakdown-title">
          <span>🔍 แยกส่วนประกอบคันจิ (คลิกเพื่อดูรายละเอียด):</span>
        </div>
        <div class="breakdown-chips-wrapper">
          ${item.literal_breakdown.map(b => `
            <a href="kanji.html?k=${encodeURIComponent(b.char)}" class="breakdown-chip" title="เปิดดูคันจิ ${b.char} ในพจนานุกรม">
              <span class="char">${b.char}</span>
              <span class="meaning">${b.meaning}</span>
            </a>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Lore Box
    const loreHtml = item.lore ? `
      <div class="vocab-lore-box">
        <div class="vocab-lore-title">💡 เกร็ดความรู้ / ที่มา:</div>
        <div>${item.lore}</div>
      </div>
    ` : '';

    return `
      <article class="vocab-card" id="vocab-${item.id}">
        <div class="vocab-card-header">
          <div class="vocab-badges">
            ${animeBadge}
            ${categoryBadge}
          </div>
          <div class="vocab-actions">
            <button type="button" class="vocab-action-btn audio-btn" data-word="${item.word}" title="ฟังเสียงอ่านภาษาญี่ปุ่น (Web Speech API)" aria-label="ออกเสียงคำว่า ${item.word}">
              🔊
            </button>
            <button type="button" class="vocab-action-btn copy-btn" data-id="${item.id}" title="คัดลอกคำศัพท์พร้อมความหมายสำหรับ Anki/สมุดจด" aria-label="คัดลอกคำศัพท์">
              📋
            </button>
          </div>
        </div>

        <div class="vocab-word-display">
          ${item.ruby_html || item.word}
        </div>

        <div class="vocab-romaji">
          /${item.romaji}/ • ${item.reading}
        </div>

        <div class="vocab-meaning-th">
          ${item.meaning_th}
        </div>

        <div class="vocab-meaning-en">
          ${item.meaning_en}
        </div>

        ${breakdownHtml}
        ${loreHtml}
      </article>
    `;
  }).join('');

  // Attach button events
  container.querySelectorAll('.audio-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playPronunciation(btn.dataset.word, btn);
    });
  });

  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const item = allItems.find(x => x.id === id);
      if (item) copyVocabularyItem(item, btn);
    });
  });
}
