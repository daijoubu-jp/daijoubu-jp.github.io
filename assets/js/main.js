/**
 * main.js
 * -------
 * Global application entry point. Initialises theme, global navigation, and routes page-specific scripts.
 */

import { initTheme } from './theme.js';
import { searchKanji, getDailyKanji, loadKanjiData } from './search.js';
import { getRecentSearches, addRecentSearch, getFavorites } from './storage.js';
import { initBrowsePage } from './browse.js';
import { initDetailPage } from './kanji-detail.js';

export function getSiteRoot() {
  const isSubdir = window.location.pathname.includes('/browse/') ||
                   window.location.pathname.includes('/knowledge/') ||
                   window.location.pathname.includes('/tools/') ||
                   window.location.pathname.includes('/games/');
  return isSubdir ? '../' : './';
}

async function startApp() {
  // 1. Initialise theme system immediately
  initTheme();

  // 2. Global mobile navigation toggle
  setupMobileNav();

  // 3. Global search bar in navbar (if present)
  setupNavSearch();

  // 4. Global keyboard shortcuts ('/' or 'Ctrl+K' focuses search input)
  setupKeyboardShortcuts();

  // 5. Global Floating Back-to-Top button
  setupBackToTop();

  // 6. Page-specific initialisation based on data-page attribute
  const pageType = document.body.dataset.page;

  if (pageType === 'home') {
    await initHomePage();
  } else if (pageType === 'browse') {
    await initBrowsePage();
  } else if (pageType === 'detail') {
    await initDetailPage();
  } else if (pageType === 'vocabulary') {
    const { initVocabularyPage } = await import('./vocabulary.js');
    await initVocabularyPage();
  } else if (pageType === 'radicals') {
    const { initRadicalsPage } = await import('./radicals.js');
    await initRadicalsPage();
  } else if (pageType === 'worksheet') {
    const { initWorksheetPage } = await import('./worksheet.js');
    await initWorksheetPage();
  } else if (pageType === 'favorites') {
    window.location.replace(`${getSiteRoot()}browse/index.html?preset=favorites`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

/**
 * Setup Global Mobile Navigation Menu (Hamburger toggle).
 */
function setupMobileNav() {
  const menuBtn = document.getElementById('nav-menu-toggle-btn');
  const navLinks = document.querySelector('.nav-links');

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle('mobile-open');
    menuBtn.classList.toggle('active', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  const closeMobileMenu = () => {
    navLinks.classList.remove('mobile-open');
    menuBtn.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Reset all accordions
    navLinks.querySelectorAll('.accordion-open').forEach(el => el.classList.remove('accordion-open'));
  };

  // Setup click handling on nav links
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Check if this link is a parent dropdown toggle
        const parentDropdown = link.parentElement.classList.contains('nav-dropdown') ? link.parentElement : null;
        const parentSubmenu = link.parentElement.classList.contains('nav-dropdown-submenu') ? link.parentElement : null;

        if (parentDropdown && link.nextElementSibling?.classList.contains('dropdown-menu')) {
          e.preventDefault();
          e.stopPropagation();
          parentDropdown.classList.toggle('accordion-open');
          return;
        }

        if (parentSubmenu && link.nextElementSibling?.classList.contains('dropdown-sub-menu')) {
          e.preventDefault();
          e.stopPropagation();
          parentSubmenu.classList.toggle('accordion-open');
          return;
        }
      }

      // Normal navigation link - close mobile menu
      closeMobileMenu();
    });
  });

  // Close when clicking outside header
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) {
      closeMobileMenu();
    }
  });

  // Close on screen resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });
}

/**
 * Setup global keyboard shortcuts.
 */
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.getElementById('hero-search-input') || 
                          document.getElementById('browse-search-input') ||
                          document.getElementById('special-filter-input') ||
                          document.getElementById('nav-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
}

/**
 * Setup Navbar mini-search.
 */
function setupNavSearch() {
  const navInput = document.getElementById('nav-search-input');
  if (!navInput) return;

  navInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = navInput.value.trim();
      if (q) {
        window.location.href = `${getSiteRoot()}browse/index.html?q=${encodeURIComponent(q)}`;
      }
    }
  });
}

/**
 * Initialise Home / Search Landing Page.
 */
async function initHomePage() {
  const searchInput = document.getElementById('hero-search-input');
  const dropdown = document.getElementById('hero-autocomplete');
  const clearBtn = document.getElementById('search-clear-btn');
  const searchForm = document.getElementById('hero-search-form');

  // Prefetch the kanji database asynchronously so search is instantaneous
  loadKanjiData().catch(e => console.warn('Prefetch failed:', e));

  // Load Kanji of the Day
  renderDailyKanji();

  // Load favorites (above recent searches)
  renderFavoriteKanji();

  // Load recent searches
  renderRecentSearches();

  // Setup Category quick links tabs
  setupCategoryTabs();

  // Setup Tsundere Alpha Warning Banner
  setupTsundereBanner();

  if (!searchInput) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);

    clearTimeout(debounceTimer);
    if (!q) {
      if (dropdown) dropdown.classList.remove('show');
      return;
    }

    debounceTimer = setTimeout(async () => {
      const results = await searchKanji(q, { limit: 8 });
      renderAutocomplete(dropdown, results);
    }, 150);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      if (dropdown) dropdown.classList.remove('show');
      searchInput.focus();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        addRecentSearch(q);
        // If single character kanji, go straight to detail page
        if (q.length === 1 && /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(q)) {
          window.location.href = `${getSiteRoot()}browse/kanji.html?k=${encodeURIComponent(q)}`;
        } else {
          window.location.href = `${getSiteRoot()}browse/index.html?q=${encodeURIComponent(q)}`;
        }
      }
    });
  }

  // Hide dropdown on outside click
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.classList.remove('show');
    }
  });
}

function renderAutocomplete(dropdown, results) {
  if (!dropdown) return;

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div style="padding: var(--spacing-md); text-align: center; color: var(--color-text-muted);">
        ไม่พบผลลัพธ์ที่ตรงกัน
      </div>
    `;
    dropdown.classList.add('show');
    return;
  }

  dropdown.innerHTML = results.map(k => {
    const readings = [...(k.onyomi || []), ...(k.kunyomi || [])].slice(0, 3).join(', ');
    const meaningTh = (k.meanings_th && k.meanings_th[0]) || '';
    const meaningEn = (k.meanings_en && k.meanings_en[0]) || '';

    return `
      <a href="${getSiteRoot()}browse/kanji.html?k=${encodeURIComponent(k.kanji)}" class="autocomplete-item">
        <span class="autocomplete-kanji">${k.kanji}</span>
        <div class="autocomplete-details">
          <div class="autocomplete-meaning">${meaningTh || meaningEn}</div>
          <div class="autocomplete-readings">${readings}</div>
        </div>
        <div>
          ${k.jlpt ? `<span class="badge badge-jlpt-n${k.jlpt}">N${k.jlpt}</span>` : ''}
        </div>
      </a>
    `;
  }).join('');

  dropdown.classList.add('show');
}

async function renderDailyKanji() {
  const dailyEl = document.getElementById('daily-kanji-container');
  if (!dailyEl) return;

  const kanji = await getDailyKanji();
  if (!kanji) return;

  const onyomi = (kanji.onyomi || []).join(', ') || '-';
  const kunyomi = (kanji.kunyomi || []).join(', ') || '-';
  const meaningTh = (kanji.meanings_th || []).join(', ') || '-';
  const meaningEn = (kanji.meanings_en || []).join(', ') || '-';

  dailyEl.innerHTML = `
    <div class="daily-card">
      <div class="daily-char-box">
        <div class="daily-char">${kanji.kanji}</div>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
          ${kanji.strokes} ขีด | Grade ${kanji.grade || 'S'}
        </div>
      </div>
      <div class="daily-details">
        <h3>
          <span style="color: var(--color-accent); font-family: var(--font-thai);">คำแปลภาษาไทย:</span>
          ${meaningTh}
        </h3>
        <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">
          <strong>English:</strong> ${meaningEn}
        </p>
        <div class="daily-readings">
          <div class="reading-pill-group">
            <span class="reading-label">音 (On):</span>
            <span class="reading-value">${onyomi}</span>
          </div>
          <div class="reading-pill-group">
            <span class="reading-label">訓 (Kun):</span>
            <span class="reading-value">${kunyomi}</span>
          </div>
        </div>
        <div style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-sm);">
          <a href="${getSiteRoot()}browse/kanji.html?k=${encodeURIComponent(kanji.kanji)}" class="action-btn" style="background-color: var(--color-accent); color: var(--color-text-inverse); border-color: var(--color-accent);">
            ดูรายละเอียดทั้งหมด →
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderFavoriteKanji() {
  const section = document.getElementById('favorites-section');
  const list = document.getElementById('favorites-list');
  if (!section || !list) return;

  const favs = getFavorites();
  if (!favs || favs.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = favs.map(char => `
    <a href="${getSiteRoot()}browse/kanji.html?k=${encodeURIComponent(char)}" class="favorite-kanji-chip" title="คันจิ ${char}">
      <span class="fav-char" lang="ja">${char}</span>
    </a>
  `).join('');
}

function setupCategoryTabs() {
  const tabBtns = document.querySelectorAll('.home-category-tab-btn');
  const panels = document.querySelectorAll('.home-category-panel');
  if (!tabBtns.length || !panels.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.target;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

function renderRecentSearches() {
  const container = document.getElementById('recent-searches-list');
  if (!container) return;

  const recents = getRecentSearches();
  if (recents.length === 0) {
    container.parentElement.style.display = 'none';
    return;
  }

  container.parentElement.style.display = 'block';
  container.innerHTML = recents.map(term => `
    <a href="${getSiteRoot()}browse/index.html?q=${encodeURIComponent(term)}" class="filter-chip">
      ${term}
    </a>
  `).join('');
}

/**
 * Setup Global Floating Back-to-Top Button.
 */
function setupBackToTop() {
  let btn = document.getElementById('back-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'เลื่อนขึ้นด้านบนสุด');
    btn.title = 'เลื่อนขึ้นด้านบนสุด';
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Handles dismissing of the Tsundere under-construction Alpha banner.
 */
function setupTsundereBanner() {
  const banner = document.getElementById('tsundere-alpha-banner');
  const closeBtn = document.getElementById('close-tsundere-banner');
  if (!banner || !closeBtn) return;

  if (sessionStorage.getItem('tsundere-banner-dismissed') === 'true') {
    banner.style.display = 'none';
  }

  closeBtn.addEventListener('click', () => {
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      banner.style.display = 'none';
      sessionStorage.setItem('tsundere-banner-dismissed', 'true');
    }, 200);
  });
}

// Register Service Worker for caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('../../sw.js', import.meta.url).href;
    const swScope = new URL('../../', import.meta.url).href;
    navigator.serviceWorker.register(swUrl, { scope: swScope }).then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch((err) => {
      console.warn('ServiceWorker registration failed: ', err);
    });
  });
}
