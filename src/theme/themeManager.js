/* Shared day/night state and palette for the portfolio. Loaded before CSS. */
(function () {
  const STORAGE_KEY = 'rafia-portfolio-theme';
  const THEMES = {
    dark: {
      css: {
        '--bg': '#020510', '--page-bg': '#060b1a',
        '--bg-card': 'rgba(8, 14, 32, 0.94)', '--bg-glass': 'rgba(10, 18, 40, 0.78)',
        '--nav-bg': 'rgba(2, 5, 16, 0.82)', '--nav-mobile-bg': 'rgba(4, 8, 24, 0.98)',
        '--border': 'rgba(56, 189, 248, 0.22)', '--border-hi': 'rgba(56, 189, 248, 0.6)',
        '--cyan': '#38bdf8', '--cyan-glow': '#00e5ff', '--violet': '#a855f7', '--violet-dark': '#7c3aed',
        '--emerald': '#10b981', '--amber': '#f59e0b', '--blue': '#0ea5e9',
        '--text': '#f1f5f9', '--text-muted': '#b0bfd0', '--text-dim': '#8193a9', '--text-strong': '#ffffff',
        '--scene-text': '#ffffff', '--scene-muted': '#e3edf8', '--error-text': '#fca5a5',
        '--scene-accent': '#38bdf8', '--scene-button-text': '#020510',
        '--text-on-accent': '#020510', '--surface': 'rgba(255,255,255,0.035)',
        '--surface-raised': 'rgba(255,255,255,0.06)', '--surface-border': 'rgba(255,255,255,0.1)',
        '--input-bg': 'rgba(255,255,255,0.06)', '--page-backdrop': 'rgba(2,5,16,0.78)',
        '--shadow-glow': '0 0 24px rgba(56,189,248,0.25)'
      },
      three: {
        background: 0x020510, fog: 0x020510, fogDensity: 0.005,
        ambientColor: 0x0e1428, ambientIntensity: 1.6,
        sunColor: 0xdbeafe, sunIntensity: 2.0, rimColor: 0x7c3aed, rimIntensity: 1.2,
        starOpacity: 0.88, pathColor: 0x38bdf8, pathOpacity: 0.85, guideColor: 0x0284c7, guideOpacity: 0.35,
        platformColor: 0x090e1f, platformRoughness: 0.6, platformMetalness: 0.4,
        planetA: 0x312e81, planetAHalo: 0xa855f7, planetB: 0x164e63, planetBRing: 0x38bdf8,
        planetC: 0x1e1b4b, asteroid: 0x334155, nebula: [0x312e81, 0x0c4a6e], nebulaOpacity: 0.045,
        labelBackground: 'rgba(6, 11, 26, 0.9)', labelText: '#ffffff', pulseOpacity: 0.38, activePulseOpacity: 0.82
      }
    },
    light: {
      css: {
        '--bg': '#e8f1fb', '--page-bg': '#eff5fc',
        '--bg-card': 'rgba(255, 255, 255, 0.94)', '--bg-glass': 'rgba(247, 251, 255, 0.84)',
        '--nav-bg': 'rgba(244, 249, 255, 0.9)', '--nav-mobile-bg': 'rgba(247, 251, 255, 0.98)',
        '--border': 'rgba(14, 116, 144, 0.24)', '--border-hi': 'rgba(3, 105, 161, 0.56)',
        '--cyan': '#0369a1', '--cyan-glow': '#0891b2', '--violet': '#7c3aed', '--violet-dark': '#6d28d9',
        '--emerald': '#047857', '--amber': '#a85208', '--blue': '#0369a1',
        '--text': '#172b41', '--text-muted': '#3b536d', '--text-dim': '#5d7188', '--text-strong': '#10243a',
        '--scene-text': '#ffffff', '--scene-muted': '#edf5ff', '--error-text': '#b42318',
        '--scene-accent': '#b6ecff', '--scene-button-text': '#10243a',
        '--text-on-accent': '#ffffff', '--surface': 'rgba(17, 61, 98, 0.045)',
        '--surface-raised': 'rgba(17, 61, 98, 0.075)', '--surface-border': 'rgba(17, 61, 98, 0.15)',
        '--input-bg': 'rgba(255,255,255,0.92)', '--page-backdrop': 'rgba(21, 41, 65, 0.34)',
        '--shadow-glow': '0 0 24px rgba(3,105,161,0.15)'
      },
      three: {
        background: 0x637f9d, fog: 0x637f9d, fogDensity: 0.0034,
        ambientColor: 0xc5d9ef, ambientIntensity: 1.85,
        sunColor: 0xffffff, sunIntensity: 2.25, rimColor: 0x7755bc, rimIntensity: 1.15,
        starOpacity: 0.98, pathColor: 0x075985, pathOpacity: 0.9, guideColor: 0x1d4ed8, guideOpacity: 0.58,
        platformColor: 0xcbd8e7, platformRoughness: 0.7, platformMetalness: 0.16,
        planetA: 0x5b55a5, planetAHalo: 0x9b70d2, planetB: 0x237b91, planetBRing: 0x075985,
        planetC: 0x58548c, asteroid: 0x71849a, nebula: [0x9d8cc4, 0x76a8c0], nebulaOpacity: 0.1,
        labelBackground: 'rgba(246, 250, 255, 0.94)', labelText: '#172b41', pulseOpacity: 0.48, activePulseOpacity: 0.9
      }
    }
  };

  const root = document.documentElement;
  const listeners = new Set();
  let storedTheme = null;
  try { storedTheme = localStorage.getItem(STORAGE_KEY); } catch (_) { /* Storage can be blocked. */ }
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  let currentTheme = THEMES[storedTheme] ? storedTheme : (systemPrefersDark ? 'dark' : 'light');

  function apply(theme, persist) {
    if (!THEMES[theme]) return;
    currentTheme = theme;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    Object.entries(THEMES[theme].css).forEach(([name, value]) => root.style.setProperty(name, value));
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* The current page still switches. */ }
    }
    syncControls(persist);
    listeners.forEach((listener) => listener(theme, THEMES[theme]));
  }

  function syncControls(announce) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-checked', String(currentTheme === 'dark'));
      if (announce) {
        const status = document.querySelector('[data-theme-status]');
        if (status) status.textContent = `${currentTheme === 'dark' ? 'Dark' : 'Light'} theme selected.`;
      }
      button.title = `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`;
    });
  }

  function attachControls() {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      if (button.dataset.themeReady) return;
      button.dataset.themeReady = 'true';
      let drag = null;
      let suppressClick = false;

      button.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const bounds = button.getBoundingClientRect();
        drag = { startX: event.clientX, bounds, minPosition: 3, maxPosition: bounds.width - 33, moved: false };
        drag.position = currentTheme === 'dark' ? drag.maxPosition : drag.minPosition;
        try { button.setPointerCapture(event.pointerId); } catch (_) { /* Capture may be unavailable. */ }
      });

      button.addEventListener('pointermove', (event) => {
        if (!drag) return;
        if (Math.abs(event.clientX - drag.startX) > 4) drag.moved = true;
        if (!drag.moved) return;
        drag.position = Math.max(drag.minPosition, Math.min(drag.maxPosition, event.clientX - drag.bounds.left - 15));
        button.style.setProperty('--theme-thumb-drag', `${drag.position}px`);
        event.preventDefault();
      });

      const finishDrag = (event, cancelled = false) => {
        if (!drag) return;
        const completed = drag;
        drag = null;
        button.style.removeProperty('--theme-thumb-drag');
        if (completed.moved && !cancelled) {
          suppressClick = true;
          apply(completed.position >= (completed.minPosition + completed.maxPosition) / 2 ? 'dark' : 'light', true);
        }
        try { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); } catch (_) { /* No capture. */ }
      };

      button.addEventListener('pointerup', (event) => finishDrag(event));
      button.addEventListener('pointercancel', (event) => finishDrag(event, true));
      button.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        apply(currentTheme === 'dark' ? 'light' : 'dark', true);
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          apply(event.key === 'ArrowRight' ? 'dark' : 'light', true);
        }
      });
    });
    syncControls(false);
  }

  const manager = {
    get current() { return currentTheme; },
    get palette() { return THEMES[currentTheme]; },
    setTheme(theme) { apply(theme, true); },
    subscribe(listener) {
      listeners.add(listener);
      listener(currentTheme, THEMES[currentTheme]);
      return () => listeners.delete(listener);
    },
    attachControls
  };

  apply(currentTheme, false);
  window.portfolioTheme = manager;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachControls, { once: true });
  else attachControls();
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && THEMES[event.newValue]) apply(event.newValue, false);
  });
}());
