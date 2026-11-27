/* Shared day/night state and palette for the portfolio. Loaded before CSS. */
(function () {
  const STORAGE_KEY = 'rafia-portfolio-theme';
  const THEMES = {
    /* "Ember & Aubergine": deep plum-black space, warm gold primary, rose + mint secondaries. */
    dark: {
      css: {
        '--bg': '#08060d', '--page-bg': '#0d0a14',
        '--bg-card': 'rgba(20, 15, 28, 0.95)', '--bg-glass': 'rgba(24, 17, 34, 0.84)',
        '--nav-bg': 'rgba(10, 7, 16, 0.88)', '--nav-mobile-bg': 'rgba(12, 9, 19, 0.98)',
        '--border': 'rgba(242, 180, 90, 0.2)', '--border-hi': 'rgba(242, 180, 90, 0.58)',
        '--cyan': '#f2b45a', '--cyan-glow': '#ffcf85', '--violet': '#e0709a', '--violet-dark': '#b8527a',
        '--emerald': '#6fd1b0', '--amber': '#f2b45a', '--blue': '#f08a5d',
        '--text': '#f4efe8', '--text-muted': '#cfc4b8', '--text-dim': '#a39789', '--text-strong': '#ffffff',
        '--scene-text': '#ffffff', '--scene-muted': '#f1e8dd', '--error-text': '#ffb4a8',
        '--scene-accent': '#f2b45a', '--scene-button-text': '#1a1208',
        '--text-on-accent': '#1a1208', '--surface': 'rgba(255,240,222,0.045)',
        '--surface-raised': 'rgba(255,240,222,0.075)', '--surface-border': 'rgba(255,240,222,0.12)',
        '--input-bg': 'rgba(255,240,222,0.07)', '--page-backdrop': 'rgba(8,6,13,0.8)',
        '--shadow-glow': '0 10px 28px rgba(0,0,0,0.45)'
      },
      three: {
        background: 0x07050c, fog: 0x07050c, fogDensity: 0.0035,
        ambientColor: 0x1f1626, ambientIntensity: 1.45,
        sunColor: 0xffe8cc, sunIntensity: 1.7, rimColor: 0x6a3a5c, rimIntensity: 0.8,
        starColor: 0xf6ecdf, starOpacity: 0.8, pathColor: 0xe9b872, pathOpacity: 0.7, guideColor: 0x8a6a52, guideOpacity: 0.2,
        platformColor: 0x140f1a, platformRoughness: 0.72, platformMetalness: 0.2,
        planetA: 0x4a2a3c, planetAHalo: 0xd98a6a, planetB: 0x3a2a4a, planetBRing: 0xe6b97a,
        planetC: 0x2f3a4a, asteroid: 0x4a4046, nebula: [0x5a2a4a, 0x7a3a3a], nebulaOpacity: 0.16,
        labelBackground: 'rgba(14, 10, 22, 0.92)', labelText: '#ffffff', pulseOpacity: 0.38, activePulseOpacity: 0.82
      }
    },
    /* Day: warm parchment surfaces with burnt-amber and plum text; the 3D scene stays a space view. */
    light: {
      css: {
        '--bg': '#efe7da', '--page-bg': '#f6f0e6',
        '--bg-card': 'rgba(255, 252, 246, 0.95)', '--bg-glass': 'rgba(252, 247, 238, 0.88)',
        '--nav-bg': 'rgba(248, 242, 232, 0.92)', '--nav-mobile-bg': 'rgba(250, 245, 236, 0.98)',
        '--border': 'rgba(120, 70, 30, 0.24)', '--border-hi': 'rgba(150, 80, 20, 0.56)',
        '--cyan': '#8f4208', '--cyan-glow': '#b8560f', '--violet': '#a62f64', '--violet-dark': '#8a2652',
        '--emerald': '#0b6b52', '--amber': '#8f4208', '--blue': '#a62f64',
        '--text': '#2a1d14', '--text-muted': '#5a4638', '--text-dim': '#75604f', '--text-strong': '#1c120b',
        '--scene-text': '#1c120b', '--scene-muted': '#3a2a1e', '--error-text': '#b42318',
        '--scene-accent': '#7a3708', '--scene-button-text': '#ffffff',
        '--text-on-accent': '#ffffff', '--surface': 'rgba(90, 50, 20, 0.05)',
        '--surface-raised': 'rgba(90, 50, 20, 0.085)', '--surface-border': 'rgba(90, 50, 20, 0.16)',
        '--input-bg': 'rgba(255,252,246,0.95)', '--page-backdrop': 'rgba(40, 24, 14, 0.36)',
        '--shadow-glow': '0 10px 28px rgba(60,30,10,0.18)'
      },
      three: {
        background: 0x0f0a16, fog: 0x0f0a16, fogDensity: 0.0032,
        ambientColor: 0x33263a, ambientIntensity: 1.45,
        sunColor: 0xfff0dc, sunIntensity: 1.8, rimColor: 0x7a4a68, rimIntensity: 0.75,
        starColor: 0xf8efe4, starOpacity: 0.86, pathColor: 0xf0c88a, pathOpacity: 0.88, guideColor: 0x9a7a60, guideOpacity: 0.22,
        platformColor: 0x1d1524, platformRoughness: 0.72, platformMetalness: 0.18,
        planetA: 0x5a3448, planetAHalo: 0xe29a78, planetB: 0x483456, planetBRing: 0xefc98a,
        planetC: 0x3a4658, asteroid: 0x5a5058, nebula: [0x6e3460, 0x8a4646], nebulaOpacity: 0.19,
        labelBackground: 'rgba(250, 244, 234, 0.95)', labelText: '#2a1d14', pulseOpacity: 0.48, activePulseOpacity: 0.9
      }
    }
  };

  const root = document.documentElement;
  const listeners = new Set();
  let transitionSequence = 0;
  let storedTheme = null;
  try { storedTheme = localStorage.getItem(STORAGE_KEY); } catch (_) { /* Storage can be blocked. */ }
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  const initialTheme = THEMES[storedTheme] ? storedTheme : (systemPrefersDark ? 'dark' : 'light');
  let currentTheme = null;

  function updateTheme(theme, persist) {
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

  function pointList(points) {
    return `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`;
  }

  function inkPolygons(origin) {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const centerX = Math.max(0, Math.min(width, origin?.x ?? width / 2));
    const centerY = Math.max(0, Math.min(height, origin?.y ?? height / 2));
    const count = 48;
    const start = [];
    const end = [];

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const edgeX = dx > 0 ? (width - centerX) / dx : dx < 0 ? -centerX / dx : Infinity;
      const edgeY = dy > 0 ? (height - centerY) / dy : dy < 0 ? -centerY / dy : Infinity;
      const edgeDistance = Math.min(edgeX > 0 ? edgeX : Infinity, edgeY > 0 ? edgeY : Infinity);
      const organicEdge = 1.38 + 0.12 * Math.sin(angle * 3 + 0.7) + 0.07 * Math.sin(angle * 7 - 0.4);
      start.push([(centerX / width) * 100, (centerY / height) * 100]);
      end.push([
        ((centerX + dx * edgeDistance * organicEdge) / width) * 100,
        ((centerY + dy * edgeDistance * organicEdge) / height) * 100
      ]);
    }

    return { start: pointList(start), end: pointList(end) };
  }

  function crossfadeUpdate(theme, persist, sequence) {
    if (typeof root.animate !== 'function') {
      updateTheme(theme, persist);
      return;
    }

    const fadeOut = root.animate(
      [{ opacity: 1 }, { opacity: 0.72 }],
      { duration: 110, easing: 'ease-out', fill: 'forwards' }
    );
    fadeOut.finished.then(() => {
      if (sequence !== transitionSequence) return;
      updateTheme(theme, persist);
      root.animate(
        [{ opacity: 0.72 }, { opacity: 1 }],
        { duration: 150, easing: 'ease-in', fill: 'none' }
      );
    }).catch(() => {
      if (sequence === transitionSequence) updateTheme(theme, persist);
    });
  }

  function apply(theme, persist, origin = null) {
    if (!THEMES[theme] || currentTheme === theme) return;

    const previousTheme = currentTheme;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const sequence = ++transitionSequence;
    root.getAnimations?.().forEach((animation) => animation.cancel());
    root.style.removeProperty('--theme-ink-start');
    root.style.removeProperty('--theme-ink-end');
    if (previousTheme === null || reduceMotion) {
      updateTheme(theme, persist);
      return;
    }

    if (typeof document.startViewTransition !== 'function') {
      crossfadeUpdate(theme, persist, sequence);
      return;
    }

    const polygons = inkPolygons(origin);
    root.style.setProperty('--theme-ink-start', polygons.start);
    root.style.setProperty('--theme-ink-end', polygons.end);

    try {
      const transition = document.startViewTransition(() => updateTheme(theme, persist));
      transition.finished.finally(() => {
        if (sequence !== transitionSequence) return;
        root.style.removeProperty('--theme-ink-start');
        root.style.removeProperty('--theme-ink-end');
      }).catch(() => {});
      transition.updateCallbackDone.catch(() => {
        if (sequence === transitionSequence && currentTheme !== theme) {
          root.style.removeProperty('--theme-ink-start');
          root.style.removeProperty('--theme-ink-end');
          crossfadeUpdate(theme, persist, sequence);
        }
      });
    } catch (_) {
      root.style.removeProperty('--theme-ink-start');
      root.style.removeProperty('--theme-ink-end');
      crossfadeUpdate(theme, persist, sequence);
    }
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
          apply(completed.position >= (completed.minPosition + completed.maxPosition) / 2 ? 'dark' : 'light', true, {
            x: event.clientX,
            y: event.clientY
          });
        }
        try { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); } catch (_) { /* No capture. */ }
      };

      button.addEventListener('pointerup', (event) => finishDrag(event));
      button.addEventListener('pointercancel', (event) => finishDrag(event, true));
      button.addEventListener('click', (event) => {
        if (suppressClick) { suppressClick = false; return; }
        const bounds = button.getBoundingClientRect();
        apply(currentTheme === 'dark' ? 'light' : 'dark', true, {
          x: event.clientX || bounds.left + bounds.width / 2,
          y: event.clientY || bounds.top + bounds.height / 2
        });
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const bounds = button.getBoundingClientRect();
          apply(event.key === 'ArrowRight' ? 'dark' : 'light', true, {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2
          });
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

  apply(initialTheme, false);
  window.portfolioTheme = manager;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachControls, { once: true });
  else attachControls();
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && THEMES[event.newValue]) apply(event.newValue, false);
  });
}());
