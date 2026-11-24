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
        background: 0x040914, fog: 0x040914, fogDensity: 0.004,
        ambientColor: 0x0c1723, ambientIntensity: 1.45,
        sunColor: 0xdce7f0, sunIntensity: 1.7, rimColor: 0x274663, rimIntensity: 0.8,
        starColor: 0xe5eef5, starOpacity: 0.76, pathColor: 0x9bd4e4, pathOpacity: 0.78, guideColor: 0x47788b, guideOpacity: 0.18,
        platformColor: 0x0b121b, platformRoughness: 0.72, platformMetalness: 0.2,
        planetA: 0x18364a, planetAHalo: 0x3e8195, planetB: 0x23434e, planetBRing: 0x83bfd2,
        planetC: 0x26384b, asteroid: 0x364654, nebula: [0x20445b, 0x2b555a], nebulaOpacity: 0.14,
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
        '--scene-text': '#10243a', '--scene-muted': '#203a55', '--error-text': '#b42318',
        '--scene-accent': '#063b59', '--scene-button-text': '#ffffff',
        '--text-on-accent': '#ffffff', '--surface': 'rgba(17, 61, 98, 0.045)',
        '--surface-raised': 'rgba(17, 61, 98, 0.075)', '--surface-border': 'rgba(17, 61, 98, 0.15)',
        '--input-bg': 'rgba(255,255,255,0.92)', '--page-backdrop': 'rgba(21, 41, 65, 0.34)',
        '--shadow-glow': '0 0 24px rgba(3,105,161,0.15)'
      },
      three: {
        background: 0x0a1420, fog: 0x0a1420, fogDensity: 0.0032,
        ambientColor: 0x253b4b, ambientIntensity: 1.45,
        sunColor: 0xe7f0f5, sunIntensity: 1.8, rimColor: 0x40647b, rimIntensity: 0.75,
        starColor: 0xe9f1f5, starOpacity: 0.84, pathColor: 0xb0deea, pathOpacity: 0.88, guideColor: 0x527f8c, guideOpacity: 0.2,
        platformColor: 0x15222c, platformRoughness: 0.72, platformMetalness: 0.18,
        planetA: 0x254d60, planetAHalo: 0x548da0, planetB: 0x31555d, planetBRing: 0x9acbd4,
        planetC: 0x354b59, asteroid: 0x50616b, nebula: [0x3a718a, 0x477b7a], nebulaOpacity: 0.17,
        labelBackground: 'rgba(246, 250, 255, 0.94)', labelText: '#172b41', pulseOpacity: 0.48, activePulseOpacity: 0.9
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
