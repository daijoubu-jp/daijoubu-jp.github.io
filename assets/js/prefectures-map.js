/**
 * prefectures-map.js
 * Interactive 47-prefecture map of Japan (都道府県 - Todōfuken) with region
 * legend filters, text search, hover/focus tooltip, per-prefecture links, and
 * viewBox-based zoom (region presets, in/out, reset, vertical pan).
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
    return `      <path d="${escapeHtml(entry.path)}" class="pref-region-${regionIndex} pref-path" fill-rule="evenodd" data-slug="${escapeHtml(entry.slug)}" data-name-ja="${escapeHtml(nameJa)}" data-name-th="${escapeHtml(nameTh)}" tabindex="0" role="link" aria-label="${escapeHtml(ariaLabel)}"></path>`;
  }).join('\n');

  const viewBox = mapData.viewBox || '0 0 455.66 395.47';
  const ariaLabel = opts.ariaLabel || 'แผนที่ประเทศญี่ปุ่น 47 จังหวัด';

  return `<svg viewBox="${escapeHtml(viewBox)}" class="pref-map-svg" id="pref-map-svg" role="group" aria-label="${escapeHtml(ariaLabel)}">
${paths}
    </svg>`;
}

/**
 * Maximum zoom-in depth: the viewport never shrinks below this fraction of
 * the base viewBox (≈12.5x). Scale 1 means the whole country is visible.
 */
export const MIN_SCALE = 0.08;

/**
 * Parses an SVG viewBox string into a rect.
 * @param {string} str e.g. "0 0 384.24 395.47"
 * @returns {{x: number, y: number, w: number, h: number}|null} null when malformed.
 */
export function parseViewBox(str) {
  const parts = String(str).trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x, y, w, h] = parts;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/**
 * Serializes a viewBox rect, rounded to 2 decimals.
 * @param {{x: number, y: number, w: number, h: number}} v
 * @returns {string}
 */
export function formatViewBox(v) {
  const r = (n) => Math.round(n * 100) / 100;
  return `${r(v.x)} ${r(v.y)} ${r(v.w)} ${r(v.h)}`;
}

/**
 * Places a viewport of size w*h centered on (cx, cy), clamped so it stays
 * fully inside the base rect (never wider/taller than the base).
 * @param {{x: number, y: number, w: number, h: number}} base
 * @param {number} w
 * @param {number} h
 * @param {number} cx
 * @param {number} cy
 * @returns {{x: number, y: number, w: number, h: number}}
 */
function placeView(base, w, h, cx, cy) {
  const vw = Math.min(w, base.w);
  const vh = Math.min(h, base.h);
  let x = cx - vw / 2;
  let y = cy - vh / 2;
  x = Math.min(Math.max(x, base.x), base.x + base.w - vw);
  y = Math.min(Math.max(y, base.y), base.y + base.h - vh);
  return { x, y, w: vw, h: vh };
}

/**
 * Zooms a viewBox about its own center, preserving the base aspect ratio.
 * @param {{x: number, y: number, w: number, h: number}} view current viewport
 * @param {{x: number, y: number, w: number, h: number}} base full-country viewport
 * @param {number} factor multiplier on viewport size (<1 zooms in, >1 zooms out)
 * @returns {{x: number, y: number, w: number, h: number}} clamped inside [MIN_SCALE, 1] of base
 */
export function zoomViewBox(view, base, factor) {
  const scale = view.w / base.w;
  const next = Math.min(Math.max(scale * factor, MIN_SCALE), 1);
  const w = base.w * next;
  const h = base.h * next;
  return placeView(base, w, h, view.x + view.w / 2, view.y + view.h / 2);
}

/**
 * Pans a viewBox vertically by a fraction of its own height.
 * @param {{x: number, y: number, w: number, h: number}} view
 * @param {{x: number, y: number, w: number, h: number}} base
 * @param {number} dyRatio positive moves the view down (content moves up)
 * @returns {{x: number, y: number, w: number, h: number}} clamped inside base
 */
export function panViewBoxY(view, base, dyRatio) {
  return placeView(base, view.w, view.h, view.x + view.w / 2, view.y + view.h / 2 + view.h * dyRatio);
}

/**
 * Fits a region bounding box into the viewport, padded and aspect-preserved.
 * @param {{x: number, y: number, width: number, height: number}} bounds DOMRect-like (e.g. SVGPathElement.getBBox())
 * @param {{x: number, y: number, w: number, h: number}} base
 * @returns {{x: number, y: number, w: number, h: number}}
 */
export function fitRegionViewBox(bounds, base) {
  const padding = 1.16; // 8% breathing room around the region
  const scale = Math.max((bounds.width * padding) / base.w, (bounds.height * padding) / base.h);
  const next = Math.min(Math.max(scale, MIN_SCALE), 1);
  const w = base.w * next;
  const h = base.h * next;
  return placeView(base, w, h, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

/**
 * Builds the top-right zoom control cluster markup (pure, no DOM access).
 * Region options reuse REGIONS/REGION_TH so labels match the legend chips.
 * @returns {string} HTML for `.pref-map-controls`
 */
export function buildMapControlsHtml() {
  const options = ['<option value="">ทั้งหมด</option>', ...REGIONS.map((region, i) => {
    const shortJa = region.replace(/地方$/, '');
    return `<option value="${i}">${REGION_TH[i]} ${shortJa}</option>`;
  })].join('\n        ');
  return `<div class="pref-map-controls" role="group" aria-label="ซุมและมุมมองแผนที่">
    <label class="pref-zoom-region">
      <span class="pref-zoom-region-label"><i class="fa-solid fa-map-location-dot"></i> ซุมตามภูมิภาค</span>
      <select id="pref-region-zoom" class="pref-zoom-select" aria-label="ซุมเข้ าภูมิภาค">
        ${options}
      </select>
    </label>
    <div class="pref-zoom-buttons">
      <button type="button" class="pref-zoom-btn" id="pref-zoom-in" aria-label="ซุมเข้ า" title="ซุมเข้ า"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
      <button type="button" class="pref-zoom-btn" id="pref-zoom-out" aria-label="ซุมออก" title="ซุมออก"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
      <button type="button" class="pref-zoom-btn" id="pref-zoom-reset" aria-label="รีเซ็ ตมุมมอง" title="รีเซ็ ตมุมมอง"><i class="fa-solid fa-rotate-left"></i></button>
      <span class="pref-zoom-sep" aria-hidden="true"></span>
      <button type="button" class="pref-zoom-btn" id="pref-pan-up" aria-label="เลื่ อนแผนที่ขึ้ นบน" title="เลื่ อนขึ้ นบน"><i class="fa-solid fa-chevron-up"></i></button>
      <button type="button" class="pref-zoom-btn" id="pref-pan-down" aria-label="เลื่ อนแผนที่ลงล่าง" title="เลื่ อนลงล่าง"><i class="fa-solid fa-chevron-down"></i></button>
    </div>
  </div>`;
}

/**
 * Initializes the prefectures map page: loads both JSON datasets, renders the
 * SVG map, wires tooltip/hover/click/keyboard interactions, region legend
 * filter chips, the text filter over both map and list, and the zoom
 * controls (region presets, in/out, reset, vertical pan).
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
        path.setAttribute('tabindex', visible ? '0' : '-1');
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

    /* Zoom controls (top-right of the map card) -------------------------- */
    const baseVB = parseViewBox(svg.getAttribute('viewBox'));
    if (mapWrap && baseVB) {
      mapWrap.insertAdjacentHTML('afterbegin', buildMapControlsHtml());
      const zoomSelect = document.getElementById('pref-region-zoom');
      let view = { ...baseVB };
      let tweenId = null;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      /**
       * Moves the viewport to `next`, tweening the viewBox attribute unless
       * the user prefers reduced motion. A new command cancels any in-flight
       * tween so rapid clicks stay responsive.
       */
      function setView(next) {
        view = next;
        if (tweenId !== null) {
          cancelAnimationFrame(tweenId);
          tweenId = null;
        }
        if (reduceMotion.matches) {
          svg.setAttribute('viewBox', formatViewBox(view));
          return;
        }
        const from = parseViewBox(svg.getAttribute('viewBox')) || { ...view };
        const to = view;
        const start = performance.now();
        const duration = 320;
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const step = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const k = ease(t);
          svg.setAttribute('viewBox', formatViewBox({
            x: from.x + (to.x - from.x) * k,
            y: from.y + (to.y - from.y) * k,
            w: from.w + (to.w - from.w) * k,
            h: from.h + (to.h - from.h) * k
          }));
          tweenId = t < 1 ? requestAnimationFrame(step) : null;
        };
        tweenId = requestAnimationFrame(step);
      }

      const ZOOM_STEP = 0.6;
      const PAN_STEP = 0.35;
      document.getElementById('pref-zoom-in').addEventListener('click', () => setView(zoomViewBox(view, baseVB, ZOOM_STEP)));
      document.getElementById('pref-zoom-out').addEventListener('click', () => setView(zoomViewBox(view, baseVB, 1 / ZOOM_STEP)));
      document.getElementById('pref-zoom-reset').addEventListener('click', () => {
        if (zoomSelect) zoomSelect.value = '';
        setView({ ...baseVB });
      });
      document.getElementById('pref-pan-up').addEventListener('click', () => setView(panViewBoxY(view, baseVB, -PAN_STEP)));
      document.getElementById('pref-pan-down').addEventListener('click', () => setView(panViewBoxY(view, baseVB, PAN_STEP)));

      if (zoomSelect) {
        zoomSelect.addEventListener('change', () => {
          if (zoomSelect.value === '') {
            setView({ ...baseVB });
            return;
          }
          let bounds = null;
          svg.querySelectorAll(`.pref-region-${Number(zoomSelect.value)}`).forEach((p) => {
            const b = p.getBBox();
            if (!b.width && !b.height) return;
            if (!bounds) {
              bounds = { x: b.x, y: b.y, width: b.width, height: b.height };
              return;
            }
            const maxX = Math.max(bounds.x + bounds.width, b.x + b.width);
            const maxY = Math.max(bounds.y + bounds.height, b.y + b.height);
            bounds.x = Math.min(bounds.x, b.x);
            bounds.y = Math.min(bounds.y, b.y);
            bounds.width = maxX - bounds.x;
            bounds.height = maxY - bounds.y;
          });
          if (bounds) setView(fitRegionViewBox(bounds, baseVB));
        });
      }
    }

    applyFilters();
  }).catch((err) => {
    console.warn('Prefectures map failed to load:', err);
    mapContainer.innerHTML = '<p class="pref-map-error">ไม่สามารถโหลดข้อมูลแผนที่ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง</p>';
  });
}
