/**
 * theme.js
 * --------
 * Handles theme switching, Light/Dark mode, localStorage persistence, and dropdown UI.
 * Supported themes: 6 Japanese themes (Spring, Summer, Autumn, Winter, Anime, Ukiyoe) × 2 Modes (Light, Dark) = 12 Variations.
 */

import { getTheme, setTheme, getThemeMode, setThemeMode } from './storage.js?v=1788415658';

export const THEMES = [
  {
    id: 'spring',
    icon: '🌸',
    nameEn: 'Spring (Sakura)',
    nameTh: 'ฤดูใบไม้ผลิ (ซากุระ)',
    nameJp: '春 (さくら)',
    swatchLight: ['#FFB7C5', '#FFF9FB', '#6EA888'],
    swatchDark: ['#FF7597', '#1E1218', '#A8D8A8']
  },
  {
    id: 'summer',
    icon: '🏮',
    nameEn: 'Summer (Matsuri)',
    nameTh: 'ฤดูร้อน (มัตสึริ)',
    nameJp: '夏 (祭り)',
    swatchLight: ['#EA580C', '#FFFBEB', '#EAB308'],
    swatchDark: ['#F97316', '#0F172A', '#FACC15']
  },
  {
    id: 'autumn',
    icon: '🍁',
    nameEn: 'Autumn (Momiji)',
    nameTh: 'ฤดูใบไม้ร่วง (โมมิจิ)',
    nameJp: '秋 (紅葉)',
    swatchLight: ['#C2410C', '#FDF8F2', '#D97706'],
    swatchDark: ['#EA580C', '#1A120E', '#F59E0B']
  },
  {
    id: 'winter',
    icon: '❄️',
    nameEn: 'Winter (Yuki)',
    nameTh: 'ฤดูหนาว (หิมะยูกิ)',
    nameJp: '冬 (雪)',
    swatchLight: ['#0284C7', '#F8FAFC', '#64748B'],
    swatchDark: ['#38BDF8', '#0B132B', '#94A3B8']
  },
  {
    id: 'anime',
    icon: '🎌',
    nameEn: 'Anime (Cyber)',
    nameTh: 'อนิเมะไซเบอร์',
    nameJp: 'アニメ (電脳)',
    swatchLight: ['#D946EF', '#FAF5FF', '#0284C7'],
    swatchDark: ['#EC4899', '#0A0A16', '#38BDF8']
  },
  {
    id: 'ukiyoe',
    icon: '🎨',
    nameEn: 'Ukiyo-e (Edo)',
    nameTh: 'ภาพพิมพ์อุคิโยะเอะ',
    nameJp: '浮世絵 (江戸)',
    swatchLight: ['#1B4F72', '#F4EAD4', '#922B21'],
    swatchDark: ['#2980B9', '#161311', '#E74C3C']
  }
];

/**
 * Toggle Light/Dark mode.
 */
export function toggleThemeMode() {
  const currentMode = getThemeMode();
  const nextMode = currentMode === 'dark' ? 'light' : 'dark';
  applyTheme(getTheme(), nextMode);
}

/**
 * Apply theme and mode.
 * @param {string} [themeId]
 * @param {'light'|'dark'} [mode]
 */
export function applyTheme(themeId, mode) {
  const currentTheme = themeId || getTheme();
  const currentMode = mode || getThemeMode();

  const selectedTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
  const validMode = currentMode === 'dark' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', selectedTheme.id);
  document.documentElement.setAttribute('data-mode', validMode);

  setTheme(selectedTheme.id);
  setThemeMode(validMode);

  // Update theme color meta tag for mobile browsers
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.content = validMode === 'dark' ? selectedTheme.swatchDark[1] : selectedTheme.swatchLight[1];

  // Update theme toggle button display in navbar
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<span>${selectedTheme.icon}</span> <span class="theme-current-name">${selectedTheme.nameTh} (${validMode === 'dark' ? 'มืด' : 'สว่าง'})</span>`;
  }

  // Synchronize all sliding switch elements on page
  document.querySelectorAll('.mode-toggle-switch').forEach(sw => {
    sw.setAttribute('aria-checked', validMode === 'dark');
    sw.setAttribute('title', `กำลังใช้โหมด${validMode === 'dark' ? 'มืด (คลิกเพื่อเปลี่ยนเป็นโหมดสว่าง)' : 'สว่าง (คลิกเพื่อเปลี่ยนเป็นโหมดมืด)'}`);
  });

  // Update active state in dropdown
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeId === selectedTheme.id);
  });
}

/**
 * Initialize theme on page load.
 */
export function initTheme() {
  const savedTheme = getTheme();
  const savedMode = getThemeMode();
  applyTheme(savedTheme, savedMode);

  // Bind dropdown toggle
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const dropdown = document.getElementById('theme-dropdown');

  if (toggleBtn && dropdown) {
    renderThemeDropdown(dropdown);

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== toggleBtn) {
        dropdown.classList.remove('show');
      }
    });
  }

  // Bind all mode sliding switches (including header switch)
  document.querySelectorAll('.header-mode-switch').forEach(sw => {
    const handleSwitch = (e) => {
      e.stopPropagation();
      toggleThemeMode();
      if (dropdown) renderThemeDropdown(dropdown);
    };
    sw.addEventListener('click', handleSwitch);
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSwitch(e);
      }
    });
  });
}

/**
 * Render theme and mode options into dropdown container.
 * @param {HTMLElement} container
 */
export function renderThemeDropdown(container) {
  const currentTheme = getTheme();
  const currentMode = getThemeMode();

  container.innerHTML = `
    <div style="max-height: 320px; overflow-y: auto; padding: 4px 0;">
      ${THEMES.map(theme => {
        const swatches = currentMode === 'dark' ? theme.swatchDark : theme.swatchLight;
        return `
          <button type="button" class="theme-option ${theme.id === currentTheme ? 'active' : ''}" data-theme-id="${theme.id}">
            <div class="theme-option-info">
              <span class="theme-option-name">${theme.icon} ${theme.nameTh}</span>
              <span class="theme-option-sub">${theme.nameJp} / ${theme.nameEn}</span>
            </div>
            <div class="theme-swatches">
              ${swatches.map(color => `<span class="theme-swatch" style="background-color: ${color}"></span>`).join('')}
            </div>
          </button>
        `;
      }).join('')}
    </div>

    <div style="padding: 8px 12px; border-top: 1px solid var(--color-border-subtle); text-align: center;">
      <button type="button" id="theme-auto-reset-btn" style="width: 100%; font-size: 0.78rem; padding: 6px; border-radius: var(--border-radius-sm); background: var(--color-surface-2); border: 1px dashed var(--color-accent); color: var(--color-accent); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all var(--transition-fast);">
        <span>🕒</span> รีเซ็ตเป็นตามฤดูกาล & เวลา
      </button>
    </div>
  `;

  // Bind Theme Selection Buttons
  container.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeId, getThemeMode());
      container.classList.remove('show');
    });
  });

  // Bind Auto Seasonal Reset Button
  const autoResetBtn = container.querySelector('#theme-auto-reset-btn');
  if (autoResetBtn) {
    autoResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('kanji-theme');
      localStorage.removeItem('kanjithai_theme');
      localStorage.removeItem('kanji-theme-mode');
      localStorage.removeItem('kanjithai_mode');
      applyTheme();
      renderThemeDropdown(container);
    });
  }
}
