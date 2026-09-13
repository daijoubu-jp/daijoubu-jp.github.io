/**
 * prefectures-map.js
 * Interactive 47-prefecture map of Japan (都道府県 - Todōfuken) with region
 * legend filters, text search, hover/focus tooltip, and per-prefecture links.
 */

export const REGIONS = ['北海道地方', '東北地方', '関東地方', '中部地方', '近畿地方', '中国地方', '四国地方', '九州・沖縄地方'];
export const REGION_INDEX = Object.fromEntries(REGIONS.map((r, i) => [r, i]));

const REGION_TH = ['ฮกไกโด', 'โทโฮกุ', 'คันโต', 'ชูบุ', 'คันไซ', 'ชูโกกุ', 'ชิโกกุ', 'คิวชู・โอกินาวา'];

const PREFECTURES_MAP_URL = new URL('../../data/prefectures-map.json', import.meta.url).href;
const PREFECTURES_URL = new URL('../../data/prefectures.json', import.meta.url).href;

/**
 * Fetches JSON once per URL and caches the promise; a failed request is
 * evicted so a later call can retry.
 * @param {string} url
 * @returns {Promise<*>}
 */
const jsonPromiseCache = new Map();
function fetchJsonCached(url) {
  if (!jsonPromiseCache.has(url)) {
    const promise = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return res.json();
    });
    promise.catch(() => jsonPromiseCache.delete(url));
    jsonPromiseCache.set(url, promise);
  }
  return jsonPromiseCache.get(url);
}

/**
 * Escapes a value for safe interpolation into HTML markup.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds the interactive Japan map SVG markup (pure, no DOM access).
 * @param {{ viewBox?: string, prefectures: Array<{code: string, slug: string, name_ja: string, path: string}> }} mapData
 *   Parsed data/prefectures-map.json.
 * @param {{ prefectures?: Array<{slug: string, name_th?: string, name_hira?: string, region?: string}> }|Array} facts
 *   Parsed data/prefectures.json (or its prefectures array).
 * @param {{ ariaLabel?: string }} [opts]
 * @returns {string} SVG markup string with one focusable path per prefecture.
 */
export function buildMapSvg(mapData, facts, opts = {}) {
  const factList = Array.isArray(facts) ? facts : ((facts && facts.prefectures) || []);
  const factsBySlug = new Map(factList.map((f) => [f.slug, f]));

  const paths = (mapData.prefectures || []).map((entry) => {
    const fact = factsBySlug.get(entry.slug) || {};
    const regionIndex = REGION_INDEX[fact.region] ?? 0;
    const nameJa = entry.name_ja || entry.slug;
    const nameTh = fact.name_th || nameJa;
    const ariaLabel = `${nameTh} (${nameJa})`;
    return `      <path d="${entry.path}" class="pref-region-${regionIndex} pref-path" fill-rule="evenodd" data-slug="${escapeHtml(entry.slug)}" data-name-ja="${escapeHtml(nameJa)}" data-name-th="${escapeHtml(nameTh)}" tabindex="0" role="link" aria-label="${escapeHtml(ariaLabel)}"></path>`;
  }).join('\n');

  const viewBox = mapData.viewBox || '0 0 455.66 395.47';
  const ariaLabel = opts.ariaLabel || 'แผนที่ประเทศญี่ปุ่น 47 จังหวัด';

  return `<svg viewBox="${escapeHtml(viewBox)}" class="pref-map-svg" id="pref-map-svg" role="img" aria-label="${escapeHtml(ariaLabel)}">
${paths}
    </svg>`;
}

/**
 * Initializes the prefectures map page: loads both JSON datasets, renders the
 * SVG map, wires tooltip/hover/click/keyboard interactions, region legend
 * filter chips, and the text filter over both map and list.
 */
export function initPrefecturesMap() {
  const mapContainer = document.getElementById('pref-map-container');
  const mapWrap = document.getElementById('pref-map-wrap');
  const tooltip = document.getElementById('pref-tooltip');
  const legend = document.getElementById('pref-legend');
  const filterInput = document.getElementById('pref-filter');

  if (!mapContainer) return;

  Promise.all([
    fetchJsonCached(PREFECTURES_MAP_URL),
    fetchJsonCached(PREFECTURES_URL)
  ]).then(([mapData, facts]) => {
    const factList = (facts && facts.prefectures) || [];
    const factsBySlug = new Map(factList.map((f) => [f.slug, f]));

    mapContainer.innerHTML = buildMapSvg(mapData, facts);
    const svg = document.getElementById('pref-map-svg');
    const paths = Array.from(svg.querySelectorAll('.pref-path'));

    let activeRegion = null;
    let query = '';

    /**
     * Applies the region filter + text query to map paths and the static list.
     */
    function applyFilters() {
      const q = query.trim().toLowerCase();

      paths.forEach((path) => {
        const fact = factsBySlug.get(path.dataset.slug) || {};
        const regionIndex = REGION_INDEX[fact.region] ?? 0;
        const haystack = [
          fact.name_th, fact.name_ja, fact.name_hira, fact.name_romaji, path.dataset.slug
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesRegion = activeRegion === null || regionIndex === activeRegion;
        const matchesQuery = !q || haystack.includes(q);
        const visible = matchesRegion && matchesQuery;
        path.classList.toggle('pref-path-dim', !visible);
        path.classList.toggle('pref-path-active', visible && activeRegion !== null);
      });

      document.querySelectorAll('.pref-region-group').forEach((group) => {
        let anyVisible = false;
        group.querySelectorAll('.pref-list-item').forEach((item) => {
          const haystack = `${item.dataset.search || ''} ${item.textContent}`.toLowerCase();
          const show = (!q || haystack.includes(q)) &&
                       (activeRegion === null || item.dataset.region === REGIONS[activeRegion]);
          item.hidden = !show;
          if (show) anyVisible = true;
        });
        group.hidden = !anyVisible;
      });
    }

    /**
     * Updates the active state of the legend chips.
     */
    function updateLegend() {
      legend.querySelectorAll('.pref-legend-chip').forEach((chip) => {
        const index = Number(chip.dataset.regionIndex);
        const isActive = index === -1 ? activeRegion === null : activeRegion === index;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });
    }

    if (legend) {
      legend.innerHTML = [
        '<button type="button" class="pref-legend-chip pref-legend-reset" data-region-index="-1" aria-pressed="false"><i class="fa-solid fa-globe"></i> ทั้งหมด</button>',
        ...REGIONS.map((region, i) => {
          const shortJa = region.replace(/地方$/, '');
          return `<button type="button" class="pref-legend-chip" data-region-index="${i}" aria-pressed="false"><span class="pref-chip-swatch pref-region-${i}"></span><span lang="ja">${shortJa}</span> <span class="pref-chip-th">${REGION_TH[i]}</span></button>`;
        })
      ].join('\n      ');

      legend.addEventListener('click', (e) => {
        const chip = e.target.closest('.pref-legend-chip');
        if (!chip) return;
        const index = Number(chip.dataset.regionIndex);
        activeRegion = (index === -1 || activeRegion === index) ? null : index;
        updateLegend();
        applyFilters();
      });
    }

    if (filterInput) {
      filterInput.addEventListener('input', () => {
        query = filterInput.value;
        applyFilters();
      });
    }

    /**
     * Shows the tooltip populated with the given prefecture's facts.
     */
    function showTooltip(fact, clientX, clientY) {
      if (!tooltip) return;
      document.getElementById('pref-tooltip-kanji').textContent = fact.name_ja || '';
      document.getElementById('pref-tooltip-hira').textContent = fact.name_hira || '';
      document.getElementById('pref-tooltip-th').textContent = fact.name_th || '';
      tooltip.hidden = false;
      tooltip.setAttribute('aria-hidden', 'false');

      const wrapRect = mapWrap.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      let left = clientX - wrapRect.left - tipRect.width / 2;
      let top = clientY - wrapRect.top - tipRect.height - 12;
      left = Math.max(8, Math.min(left, wrapRect.width - tipRect.width - 8));
      top = Math.max(8, top);
      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
    }

    function hideTooltip() {
      if (!tooltip) return;
      tooltip.hidden = true;
      tooltip.setAttribute('aria-hidden', 'true');
    }

    /**
     * Navigates to the prefecture detail page.
     */
    function goToPrefecture(slug) {
      window.location.href = `jp-prefecture.html?p=${encodeURIComponent(slug)}`;
    }

    mapContainer.addEventListener('mousemove', (e) => {
      const path = e.target.closest('.pref-path');
      if (!path || !mapWrap) return;
      showTooltip(factsBySlug.get(path.dataset.slug) || {}, e.clientX, e.clientY);
    });

    mapContainer.addEventListener('mouseleave', hideTooltip);

    mapContainer.addEventListener('focusin', (e) => {
      const path = e.target.closest('.pref-path');
      if (!path || !mapWrap) return;
      const rect = path.getBoundingClientRect();
      showTooltip(factsBySlug.get(path.dataset.slug) || {}, rect.left + rect.width / 2, rect.top);
    });

    mapContainer.addEventListener('focusout', hideTooltip);

    mapContainer.addEventListener('click', (e) => {
      const path = e.target.closest('.pref-path');
      if (path) goToPrefecture(path.dataset.slug);
    });

    mapContainer.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const path = e.target.closest('.pref-path');
      if (path) {
        e.preventDefault();
        goToPrefecture(path.dataset.slug);
      }
    });

    applyFilters();
  }).catch((err) => {
    console.warn('Prefectures map failed to load:', err);
    mapContainer.innerHTML = '<p class="pref-map-error">ไม่สามารถโหลดข้อมูลแผนที่ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง</p>';
  });
}
