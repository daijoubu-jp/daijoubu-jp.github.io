/**
 * radicals.js
 * -----------
 * Logic for the 214 Kangxi Radicals Table (radicals.html).
 * Features:
 * - Real-time search (Character, Japanese Name, Thai meaning)
 * - Filter by stroke count (1-17 strokes)
 * - Filter by radical position (へん, つくり, かんむり, あし, たれ, にょう, かまえ, その他)
 * - Quick links to browse.html?radical=X
 */

let cachedRadicals = null;
let currentStroke = 'all';
let currentPosition = 'all';
let searchQuery = '';

export async function loadRadicalsData() {
  if (cachedRadicals) return cachedRadicals;
  try {
    const dataUrl = new URL('../../data/radicals.json?v=1788411000', import.meta.url).href;
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    cachedRadicals = await res.json();
  } catch (err) {
    console.error('Failed to load radicals.json:', err);
    cachedRadicals = [];
  }
  return cachedRadicals;
}

export async function initRadicalsPage() {
  await loadRadicalsData();

  // Stroke Filter Chips
  document.querySelectorAll('.stroke-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stroke-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStroke = btn.dataset.stroke;
      renderRadicals();
    });
  });

  // Position Filter Select
  const posSelect = document.getElementById('radical-position-select');
  if (posSelect) {
    posSelect.addEventListener('change', () => {
      currentPosition = posSelect.value;
      renderRadicals();
    });
  }

  // Search Input
  const searchInput = document.getElementById('radical-search-input');
  const clearBtn = document.getElementById('radical-clear-btn');
  let searchTimer = null;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        if (clearBtn) clearBtn.classList.toggle('visible', !!searchQuery);
        renderRadicals();
      }, 150);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      searchQuery = '';
      renderRadicals();
      searchInput.focus();
    });
  }

  // Read URL parameters (e.g. ?stroke=3 or ?pos=へん)
  const urlParams = new URLSearchParams(window.location.search);
  const strokeParam = urlParams.get('stroke');
  if (strokeParam) {
    const targetBtn = document.querySelector(`.stroke-filter-btn[data-stroke="${strokeParam}"]`);
    if (targetBtn) {
      document.querySelectorAll('.stroke-filter-btn').forEach(b => b.classList.remove('active'));
      targetBtn.classList.add('active');
      currentStroke = strokeParam;
    }
  }
  const posParam = urlParams.get('pos');
  if (posParam && posSelect) {
    posSelect.value = posParam;
    currentPosition = posParam;
  }

  renderRadicals();
}

export async function renderRadicals() {
  const container = document.getElementById('radicals-grid');
  const countEl = document.getElementById('radicals-count');
  if (!container) return;

  const radicals = await loadRadicalsData();

  const filtered = radicals.filter(item => {
    if (currentStroke !== 'all' && Number(item.strokes) !== Number(currentStroke)) {
      return false;
    }

    if (currentPosition !== 'all' && item.position !== currentPosition) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery;
      const matchRad = item.radical.toLowerCase().includes(q);
      const matchVariants = item.variants && item.variants.some(v => v.toLowerCase().includes(q));
      const matchName = item.name_jp.toLowerCase().includes(q);
      const matchMeaning = item.meaning_th.toLowerCase().includes(q);
      const matchNum = String(item.number) === q;

      if (!matchRad && !matchVariants && !matchName && !matchMeaning && !matchNum) {
        return false;
      }
    }

    return true;
  });

  if (countEl) {
    countEl.textContent = `แสดง ${filtered.length} จาก 214 หมวดอักษร`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>ไม่พบหมวดอักษรที่ตรงกับเงื่อนไข</h3>
        <p style="color: var(--color-text-muted);">ลองล้างคำค้นหาหรือเลือกตัวกรองใหม่อีกครั้ง</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const variantsText = item.variants && item.variants.length > 1 
      ? item.variants.join(' / ') 
      : item.radical;

    return `
      <article class="radical-card" id="rad-${item.number}">
        <div class="radical-card-header">
          <span class="radical-number">#${item.number}</span>
          <span class="radical-strokes-badge">${item.strokes} ขีด</span>
          <span class="radical-pos-badge">${item.position}</span>
        </div>

        <div class="radical-char-box">
          <span class="radical-char">${item.radical}</span>
          ${item.variants.length > 1 ? `<span class="radical-variants" title="รูปแปลง (Variants)">(${variantsText})</span>` : ''}
        </div>

        <div class="radical-name">
          ${item.name_jp}
        </div>

        <div class="radical-meaning">
          ${item.meaning_th}
        </div>

        <div class="radical-meta-row">
          <span class="radical-count-chip" title="จำนวนคันจิใช้บ่อยในหมวดนี้">
            常用: <strong>${item.joyo_count}</strong>
          </span>
          <span class="radical-count-chip" title="จำนวนคันจิทั้งหมดในพจนานุกรม">
            ทั้งหมด: <strong>${item.total_kanji}</strong>
          </span>
        </div>

        <a href="index.html?radical=${item.number}" class="radical-browse-btn" title="ดูคันจิทั้งหมดในหมวด ${item.radical}">
          ค้นหาคันจิในหมวดนี้ ➔
        </a>
      </article>
    `;
  }).join('');
}
