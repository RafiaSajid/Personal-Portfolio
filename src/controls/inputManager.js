import * as THREE from 'three';

export class InputManager {
  constructor(canvasElement, onInteractCallback = null) {
    this.canvas = canvasElement;
    this.onInteract = onInteractCallback;

    // Output state consumed by AvatarController
    this.moveVector = new THREE.Vector2(0, 0);
    this.isSprinting = false;
    this.isJumping = false;
    this.isDraggingCamera = false;

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Pointer tracking
    this.previousPointerPos = { x: 0, y: 0 };
    this.activePointers = new Map();

    // Virtual Joystick state for mobile
    this.joystick = {
      active: false,
      origin: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      identifier: null,
      maxRadius: 50
    };

    this.onCameraRotate = null;
    this.onCameraZoom = null;

    this.init();
  }

  init() {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Avoid intercepting input if typing into form inputs or chat
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          this.keys.jump = true;
          e.preventDefault();
          break;
        case 'KeyE':
        case 'Enter':
          if (this.onInteract) this.onInteract();
          break;
      }
      this.updateMovementVector();
    });

    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

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
          this.keys.jump = false;
          break;
      }
      this.updateMovementVector();
    });
  }

  updateMovementVector() {
    // If virtual joystick is active on touch, it overrides keyboard
    if (this.joystick.active) return;

    let x = 0;
    let y = 0;

    if (this.keys.left) x -= 1;
    if (this.keys.right) x += 1;
    if (this.keys.forward) y += 1;
    if (this.keys.backward) y -= 1;

    this.moveVector.set(x, y);
    if (this.moveVector.lengthSq() > 1) {
      this.moveVector.normalize();
    }

    this.isSprinting = this.keys.sprint;
    this.isJumping = this.keys.jump;
  }

  setupMouse() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDraggingCamera = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingCamera) return;

      const deltaX = (e.clientX - this.previousPointerPos.x) * 0.005;
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
      const deltaZoom = Math.sign(e.deltaY) * 0.6;
      if (this.onCameraZoom) {
        this.onCameraZoom(deltaZoom);
      }
    }, { passive: false });
  }

  setupTouch() {
    const joystickZone = document.getElementById('virtual-joystick-zone');
    const joystickHandle = document.getElementById('virtual-joystick-handle');

    if (!joystickZone) return;

    // Handle touch movement on joystick zone
    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = joystickZone.getBoundingClientRect();
      this.joystick.active = true;
      this.joystick.identifier = touch.identifier;
      this.joystick.origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.updateJoystickPosition(touch.clientX, touch.clientY, joystickHandle);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystick.active && touch.identifier === this.joystick.identifier) {
          e.preventDefault();
          this.updateJoystickPosition(touch.clientX, touch.clientY, joystickHandle);
        } else if (!this.joystick.active || touch.identifier !== this.joystick.identifier) {
          // Other touch moves camera
          if (this.previousPointerPos.x !== 0) {
            const deltaX = (touch.clientX - this.previousPointerPos.x) * 0.007;
            const deltaPitch = (touch.clientY - this.previousPointerPos.y) * 0.005;
            if (this.onCameraRotate) this.onCameraRotate(deltaX, deltaPitch);
          }
          this.previousPointerPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.identifier) {
          this.joystick.active = false;
          this.joystick.identifier = null;
          this.moveVector.set(0, 0);
          if (joystickHandle) {
            joystickHandle.style.transform = `translate(0px, 0px)`;
          }
        }
      }
      this.previousPointerPos = { x: 0, y: 0 };
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  updateJoystickPosition(clientX, clientY, handleElement) {
    const dx = clientX - this.joystick.origin.x;
    const dy = clientY - this.joystick.origin.y;
    const distance = Math.hypot(dx, dy);
    const maxRadius = this.joystick.maxRadius;

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(distance, maxRadius);

    const targetX = Math.cos(angle) * clampedDist;
    const targetY = Math.sin(angle) * clampedDist;

    if (handleElement) {
      handleElement.style.transform = `translate(${targetX}px, ${targetY}px)`;
    }

    // Normalized move vector (-1 to 1)
    const normX = targetX / maxRadius;
    const normY = -(targetY / maxRadius); // Invert Y for forward direction

    this.moveVector.set(normX, normY);
  }
}
