/**
 * PerspectiveGrid - Interactive Subtle 3D Grid Effect for Contact Section
 * Adapted from the Vengeance perspective-grid concept in pure CSS & vanilla JS.
 *
 * Requirements:
 * - Subtle contact background only.
 * - Plain CSS & vanilla JavaScript (no React component).
 * - Nearby grid cells change brightness/color relative to pointer position (not full-screen wash).
 * - Touch support with a momentary highlight on tap/touch.
 * - Text remains readable against the background at all times.
 * - Reduced motion support (disables dynamic transitions and animation when requested).
 */

export class PerspectiveGrid {
  constructor(containerElement) {
    this.container = typeof containerElement === 'string'
      ? document.querySelector(containerElement)
      : containerElement;

    if (!this.container) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas = null;
    this.ctx = null;
    this.mouse = { x: -1000, y: -1000, active: false, radius: 140 };
    this.animationFrame = null;
    this.cellSize = 36;

    this.init();
  }

  init() {
    // Add wrapper class for perspective container
    this.container.classList.add('perspective-grid-host');

    // Create perspective plane
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'perspective-grid-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');

    // Insert canvas behind content
    this.container.insertBefore(this.canvas, this.container.firstChild);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    if (!this.reducedMotion) {
      this.bindEvents();
      this.render();
    } else {
      this.drawStatic();
    }

    // React to system reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.drawStatic();
      } else {
        this.bindEvents();
        this.render();
      }
    });
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);
    if (this.reducedMotion) this.drawStatic();
  }

  bindEvents() {
    const updatePointer = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = clientX - rect.left;
      this.mouse.y = clientY - rect.top;
      this.mouse.active = true;
    };

    this.container.addEventListener('pointermove', (e) => {
      updatePointer(e.clientX, e.clientY);
    });

    this.container.addEventListener('pointerleave', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    // Touch support with momentary cell highlight
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      // Fade out after momentary touch
      setTimeout(() => {
        this.mouse.active = false;
        this.mouse.x = -1000;
        this.mouse.y = -1000;
      }, 400);
    }, { passive: true });
  }

  drawGrid() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const step = this.cellSize;

    ctx.clearRect(0, 0, w, h);

    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;

    // Base subtle lines
    ctx.lineWidth = 1;

    // Check theme colors
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const baseLineColor = isLight ? 'rgba(14, 165, 233, 0.08)' : 'rgba(56, 189, 248, 0.07)';
    const baseDotColor = isLight ? 'rgba(14, 165, 233, 0.15)' : 'rgba(56, 189, 248, 0.14)';
    const glowColor = isLight ? 'rgba(14, 165, 233, 0.45)' : 'rgba(56, 189, 248, 0.55)';

    // Vertical lines
    for (let c = 0; c <= cols; c++) {
      const x = c * step;
      ctx.beginPath();
      ctx.strokeStyle = baseLineColor;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r <= rows; r++) {
      const y = r * step;
      ctx.beginPath();
      ctx.strokeStyle = baseLineColor;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Localized cell & intersection highlight near pointer
    if (this.mouse.active) {
      const mx = this.mouse.x;
      const my = this.mouse.y;
      const radius = this.mouse.radius;

      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          const x = c * step;
          const y = r * step;
          const dist = Math.hypot(x - mx, y - my);

          if (dist < radius) {
            const intensity = Math.pow(1 - dist / radius, 2);
            // Highlight intersecting cell node
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = intensity;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Highlight adjacent local segment
            ctx.strokeStyle = glowColor;
            ctx.beginPath();
            ctx.moveTo(Math.max(0, x - step * 0.5), y);
            ctx.lineTo(Math.min(w, x + step * 0.5), y);
            ctx.moveTo(x, Math.max(0, y - step * 0.5));
            ctx.lineTo(x, Math.min(h, y + step * 0.5));
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1.0;
    } else {
      // Draw subtle intersection dots statically
      for (let c = 0; c <= cols; c += 2) {
        for (let r = 0; r <= rows; r += 2) {
          ctx.fillStyle = baseDotColor;
          ctx.beginPath();
          ctx.arc(c * step, r * step, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawStatic() {
    if (!this.ctx) return;
    this.mouse.active = false;
    this.drawGrid();
  }

  render() {
    if (this.reducedMotion) return;
    this.drawGrid();
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
