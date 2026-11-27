import * as THREE from 'three';

export class InputManager {
  constructor(canvasElement, { onInteract = null, onCameraRotate = null, onCameraZoom = null } = {}) {
    this.canvas = canvasElement;
    this.onInteract = onInteract;
    this.onCameraRotate = onCameraRotate;
    this.onCameraZoom = onCameraZoom;

    // Movement vector consumption
    this.moveVector = new THREE.Vector2(0, 0);
    this.isSprinting = false;
    this.isDraggingCamera = false;
    this.previousPointerPos = { x: 0, y: 0 };

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      up: false,
      down: false
    };

    // D-Pad state for mobile
    this.dpadState = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    this.init();
  }

  init() {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouchAndDpad();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // CRITICAL: Stop keyboard controls from hijacking typing when using an input, textarea, or chatbot!
      const activeTag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable) {
        if (e.key === 'Escape') {
          // Allow Escape to unfocus or close panels
          document.activeElement.blur();
        }
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          this.hideIntroHint();
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          this.hideIntroHint();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          this.hideIntroHint();
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          this.hideIntroHint();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          this.keys.up = true;
          if (window.__shipFlying) e.preventDefault();
          break;
        case 'KeyC':
        case 'ControlLeft':
          this.keys.down = true;
          break;
        case 'KeyE':
        case 'Enter':
          if (this.onInteract) this.onInteract();
          break;
        case 'Escape':
          window.dispatchEvent(new CustomEvent('ui:escape'));
          break;
      }
      this.updateMovement();
    });

    window.addEventListener('keyup', (e) => {
      const activeTag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'Space':
          this.keys.up = false;
          break;
        case 'KeyC':
        case 'ControlLeft':
          this.keys.down = false;
          break;
      }
      this.updateMovement();
    });
  }

  updateMovement() {
    let x = 0;
    let y = 0;

    // Merge keyboard + mobile D-pad input
    if (this.keys.left || this.dpadState.left) x -= 1;
    if (this.keys.right || this.dpadState.right) x += 1;
    if (this.keys.forward || this.dpadState.up) y += 1;
    if (this.keys.backward || this.dpadState.down) y -= 1;

    this.moveVector.set(x, y);
    if (this.moveVector.lengthSq() > 1) {
      this.moveVector.normalize();
    }

    this.isSprinting = this.keys.sprint;
  }

  setupMouse() {
    this.canvas.addEventListener('mousedown', (e) => {
      // Left click drag on canvas orbits camera
      if (e.button === 0) {
        this.isDraggingCamera = true;
        this.previousPointerPos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingCamera) return;

      const deltaX = (e.clientX - this.previousPointerPos.x) * 0.004;
      const deltaPitch = (e.clientY - this.previousPointerPos.y) * 0.003;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };

      if (this.onCameraRotate) {
        this.onCameraRotate(deltaX, deltaPitch);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingCamera = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const deltaZoom = Math.sign(e.deltaY) * 0.5;
      if (this.onCameraZoom) {
        this.onCameraZoom(deltaZoom);
      }
    }, { passive: false });
  }

  setupTouchAndDpad() {
    // Mobile D-Pad button handling
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach((btn) => {
      const dir = btn.getAttribute('data-dir');
      if (!dir) return;

      const handlePress = (e) => {
        e.preventDefault();
        this.dpadState[dir] = true;
        btn.classList.add('pressed');
        this.hideIntroHint();
        this.updateMovement();
      };

      const handleRelease = (e) => {
        e.preventDefault();
        this.dpadState[dir] = false;
        btn.classList.remove('pressed');
        this.updateMovement();
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });

    // Touch swipe on canvas rotates camera
    let touchStart = { x: 0, y: 0 };
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = (touch.clientX - touchStart.x) * 0.006;
        const dy = (touch.clientY - touchStart.y) * 0.004;
        touchStart = { x: touch.clientX, y: touch.clientY };

        if (this.onCameraRotate) {
          this.onCameraRotate(dx, dy);
        }
      }
    }, { passive: true });
  }

  hideIntroHint() {
    const hint = document.getElementById('home-intro');
    if (hint && !hint.classList.contains('hidden')) {
      hint.classList.add('hidden');
    }
  }
}
