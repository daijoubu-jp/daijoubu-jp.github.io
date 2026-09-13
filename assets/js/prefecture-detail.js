/**
 * prefecture-detail.js
 * Dynamic per-prefecture detail view for knowledge/jp-prefecture.html?p=<slug>:
 * header with TTS, region/code badges, stats, symbols, etymology, places and
 * products lists, kanji dictionary bridge, and prev/next navigation.
 */

import { REGION_INDEX } from './prefectures-map.js';

const PREFECTURES_URL = new URL('../../data/prefectures.json', import.meta.url).href;

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Finds a prefecture by slug; null-safe for missing arrays or slugs.
 * @param {Array<{slug: string}>|null} prefectures
 * @param {string|null} slug
 * @returns {Object|null}
 */
export function findPrefecture(prefectures, slug) {
  if (!Array.isArray(prefectures) || !slug) return null;
  return prefectures.find((p) => p && p.slug === slug) || null;
}

/**
 * Returns the kanji of a prefecture name with 都/道/府/県 stripped and
 * duplicates removed, preserving first-appearance order.
 * @param {string} nameJa
 * @returns {string}
 */
export function uniqueKanji(nameJa) {
  const chars = Array.from(String(nameJa || '')).filter((ch) => !'道都府県'.includes(ch));
  return [...new Set(chars)].join('');
}

/**
 * Formats a population figure, e.g. 5224614 → "5,224,614 คน".
 * @param {number} n
 * @returns {string}
 */
export function formatPopulation(n) {
  return `${Number(n).toLocaleString('en-US')} คน`;
}

/**
 * Formats an area figure rounded to whole km², e.g. 83424.34 → "83,424 ตร.กม.".
 * @param {number} n
 * @returns {string}
 */
export function formatArea(n) {
  return `${Math.round(Number(n)).toLocaleString('en-US')} ตร.กม.`;
}

/**
 * Builds the display title of a prefecture, e.g. "北海道 (ほっかいどう)".
 * @param {{ name_ja: string, name_hira: string }} p
 * @returns {string}
 */
export function prefectureTitle(p) {
  return `${p.name_ja} (${p.name_hira})`;
}

/**
 * Builds the full detail markup for one prefecture (pure, no DOM access).
 * Prev/next buttons carry the `hidden` attribute at the 01/47 boundaries.
 * @param {Object} p Prefecture record from data/prefectures.json.
 * @param {Array<Object>} all Full prefectures list ordered by code.
 * @returns {string} HTML markup.
 */
export function buildDetailHtml(p, all) {
  const regionIndex = REGION_INDEX[p.region] ?? 0;
  const index = all.findIndex((x) => x && x.slug === p.slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const audioBtn = (text, label) =>
    `<button type="button" class="audio-btn" data-tts="${escapeHtml(text)}" title="ฟังเสียงอ่าน ${escapeHtml(label)}" aria-label="ฟังเสียงอ่าน ${escapeHtml(label)}">🔊</button>`;

  const placeItem = (item) => `
        <li class="pref-place-item">
          <span class="pref-place-name" lang="ja">${escapeHtml(item.name)}</span>
          ${item.th ? `<span class="pref-place-th">${escapeHtml(item.th)}</span>` : ''}
        </li>`;

  const listCard = (title, icon, items) => `
      <div class="pref-detail-card pref-list-card">
        <h3 class="pref-detail-card-title"><i class="fa-solid ${icon}"></i> ${title}</h3>
        <ul class="pref-place-list">
${items.map(placeItem).join('\n')}
        </ul>
      </div>`;

  const kanjiLinks = Array.from(uniqueKanji(p.name_ja))
    .map((ch) => `<a href="../browse/kanji.html?k=${encodeURIComponent(ch)}" target="_blank" rel="noopener" class="pref-kanji-link" lang="ja" title="ดูข้อมูลคันจิ ${escapeHtml(ch)} ในพจนานุกรม">${escapeHtml(ch)}</a>`)
    .join('\n      ');

  return `
    <a href="jp-prefectures.html" class="pref-detail-back"><i class="fa-solid fa-arrow-left"></i> กลับไปหน้าแผนที่ 47 จังหวัด</a>

    <div class="pref-detail-card pref-detail-header">
      <div class="pref-detail-name-row">
        <h2 class="pref-detail-name" lang="ja">${escapeHtml(p.name_ja)}</h2>
        ${audioBtn(p.name_ja, p.name_ja)}
      </div>
      <p class="pref-detail-readings">
        <span class="pref-detail-hira" lang="ja">${escapeHtml(p.name_hira)}</span>
        <span class="pref-detail-romaji">${escapeHtml(p.name_romaji)}</span>
        <span class="pref-detail-th">${escapeHtml(p.name_th)}</span>
      </p>
      <div class="pref-detail-badges">
        <span class="pref-badge-region pref-region-${regionIndex}" lang="ja">${escapeHtml(p.region)}</span>
        <span class="pref-badge-code">รหัส ${escapeHtml(p.code)}</span>
      </div>
    </div>

    <div class="pref-detail-card pref-stats-grid">
      <div class="pref-stat-item">
        <div class="pref-stat-label"><i class="fa-solid fa-city"></i> เมืองหลวง</div>
        <div class="pref-stat-value"><span lang="ja">${escapeHtml(p.capital)}</span>${audioBtn(p.capital, p.capital)}</div>
        <div class="pref-stat-sub" lang="ja">${escapeHtml(p.capital_reading)}</div>
      </div>
      <div class="pref-stat-item">
        <div class="pref-stat-label"><i class="fa-solid fa-users"></i> ประชากร</div>
        <div class="pref-stat-value">${escapeHtml(formatPopulation(p.population))}</div>
        <div class="pref-stat-sub">ข้อมูลปี ${escapeHtml(p.population_year)}</div>
      </div>
      <div class="pref-stat-item">
        <div class="pref-stat-label"><i class="fa-solid fa-mountain-sun"></i> พื้นที่</div>
        <div class="pref-stat-value">${escapeHtml(formatArea(p.area_km2))}</div>
      </div>
    </div>

    <div class="pref-symbols-grid">
      <div class="pref-detail-card pref-symbol-card">
        <div class="pref-symbol-kanji" lang="ja">花</div>
        <div class="pref-symbol-label">ดอกไม้ประจำจังหวัด</div>
        <div class="pref-symbol-value" lang="ja">${escapeHtml(p.flower)}</div>
      </div>
      <div class="pref-detail-card pref-symbol-card">
        <div class="pref-symbol-kanji" lang="ja">木</div>
        <div class="pref-symbol-label">ต้นไม้ประจำจังหวัด</div>
        <div class="pref-symbol-value" lang="ja">${escapeHtml(p.tree)}</div>
      </div>
      <div class="pref-detail-card pref-symbol-card">
        <div class="pref-symbol-kanji" lang="ja">鳥</div>
        <div class="pref-symbol-label">นกประจำจังหวัด</div>
        <div class="pref-symbol-value" lang="ja">${escapeHtml(p.bird)}</div>
      </div>
    </div>

    <div class="pref-detail-card pref-etymology-card">
      <h3 class="pref-detail-card-title"><i class="fa-solid fa-book-open"></i> ที่มาของชื่อจังหวัด <span lang="ja">(名前の由来)</span></h3>
      <p class="pref-etymology-text">${escapeHtml(p.etymology)}</p>
    </div>

    <div class="pref-lists-grid">${listCard('สถานที่น่าสนใจ', 'fa-map-location-dot', p.places || [])}${listCard('ผลิตภัณฑ์ท้องถิ่น', 'fa-basket-shopping', p.products || [])}
    </div>

    <div class="pref-detail-card pref-kanji-bridge">
      <h3 class="pref-detail-card-title"><i class="fa-solid fa-book"></i> เรียนคันจิจากชื่อจังหวัดนี้</h3>
      <div class="pref-kanji-links">
      ${kanjiLinks}
      </div>
    </div>

    <nav class="pref-detail-nav" aria-label="นำทางจังหวัดก่อนหน้าและถัดไป">
      ${prev ? `<a href="jp-prefecture.html?p=${encodeURIComponent(prev.slug)}" class="pref-nav-btn pref-nav-prev">
        <span class="pref-nav-label">← จังหวัดก่อนหน้า</span>
        <span class="pref-nav-name-th">${escapeHtml(prev.name_th)}</span>
        <span class="pref-nav-name-ja" lang="ja">${escapeHtml(prev.name_ja)}</span>
      </a>` : '<span class="pref-nav-btn pref-nav-prev" hidden></span>'}
      ${next ? `<a href="jp-prefecture.html?p=${encodeURIComponent(next.slug)}" class="pref-nav-btn pref-nav-next">
        <span class="pref-nav-label">จังหวัดถัดไป →</span>
        <span class="pref-nav-name-th">${escapeHtml(next.name_th)}</span>
        <span class="pref-nav-name-ja" lang="ja">${escapeHtml(next.name_ja)}</span>
      </a>` : '<span class="pref-nav-btn pref-nav-next" hidden></span>'}
    </nav>`;
}

/**
 * Builds the Thai meta description for one prefecture.
 * @param {Object} p Prefecture record.
 * @returns {string}
 */
export function prefectureDescription(p) {
  return `ข้อมูลจังหวัด${p.name_th} (${p.name_ja}) ภูมิภาค${p.region} เมืองหลวง${p.capital} พร้อมที่มาของชื่อ ประชากร พื้นที่ สัญลักษณ์ประจำจังหวัด สถานที่ท่องเที่ยว และผลิตภัณฑ์ท้องถิ่น`;
}

/**
 * Renders the error/empty state card and unhides it.
 * @param {HTMLElement|null} errorBox
 * @param {HTMLElement|null} container
 * @param {string} title Plain-text heading; escaped before insertion.
 * @param {string} detailHtml Trusted HTML markup built by this module.
 */
function showErrorCard(errorBox, container, title, detailHtml) {
  if (!container || !errorBox) return;
  container.innerHTML = '';
  errorBox.innerHTML = `
      <div class="pref-detail-error-icon">⚠️</div>
      <h2>${escapeHtml(title)}</h2>
      ${detailHtml}
      <a href="jp-prefectures.html" class="action-btn">กลับไปหน้าแผนที่ 47 จังหวัด</a>
  `;
  errorBox.hidden = false;
}

/**
 * Speaks Japanese text via the Web Speech API (mirrors kanji-detail.js
 * conventions: ja-JP, rate 0.88, ja voice preference, playing state).
 * @param {string} text
 * @param {HTMLElement|null} targetBtn
 */
function speakJapanese(text, targetBtn = null) {
  if (!('speechSynthesis' in window)) return;
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  window.speechSynthesis.cancel();
  const cleanText = String(text || '').replace(/[.・]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.88;

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const jaVoice = voices.find((v) => v.lang === 'ja-JP' || v.lang === 'ja_JP' || (v.lang && v.lang.startsWith('ja')));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }
  }

  if (targetBtn) {
    targetBtn.classList.add('playing');
    utterance.onend = () => targetBtn.classList.remove('playing');
    utterance.onerror = () => targetBtn.classList.remove('playing');
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Wires the audio buttons rendered into the detail container; hides them all
 * when the Web Speech API is unavailable (graceful degradation).
 * @param {HTMLElement} container
 */
function initTtsControls(container) {
  const buttons = container.querySelectorAll('.audio-btn[data-tts]');
  if (!('speechSynthesis' in window)) {
    buttons.forEach((btn) => { btn.hidden = true; });
    return;
  }
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.audio-btn[data-tts]');
    if (!btn) return;
    e.preventDefault();
    speakJapanese(btn.dataset.tts, btn);
  });
}

/**
 * Initializes the prefecture detail page: resolves ?p=slug, loads the data
 * once, renders the detail view, and updates title/meta description.
 */
export async function initPrefectureDetail() {
  const container = document.getElementById('prefecture-detail-container');
  const errorBox = document.getElementById('pref-detail-error');
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get('p');
  if (!slug) {
    window.location.replace('jp-prefectures.html');
    return;
  }

  let list = [];
  try {
    const data = await fetchJsonCached(PREFECTURES_URL);
    list = (data && data.prefectures) || [];
  } catch (err) {
    console.warn('Prefecture detail failed to load:', err);
    showErrorCard(errorBox, container, 'ไม่สามารถโหลดข้อมูลจังหวัดได้ในขณะนี้', '<p>กรุณาลองใหม่ภายหลัง</p>');
    return;
  }

  const prefecture = findPrefecture(list, slug);
  if (!prefecture) {
    showErrorCard(errorBox, container, 'ไม่พบจังหวัดที่ระบุ', `<p>ไม่พบจังหวัดสำหรับ 「${escapeHtml(slug)}」 กรุณาเลือกจังหวัดจากแผนที่</p>`);
    return;
  }

  container.innerHTML = buildDetailHtml(prefecture, list);
  errorBox.hidden = true;
  errorBox.innerHTML = '';

  document.title = `${prefectureTitle(prefecture)} | Daijoubu JP`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', prefectureDescription(prefecture));
  }

  initTtsControls(container);
}