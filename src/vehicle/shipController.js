import * as THREE from 'three';

/* A small procedural starship parked beside the explorer. Board it with E (or the
   on-screen button), fly it anywhere in the home universe, land with E. */

const SHIP_BOUNDS = 430;      // flight limit on x/z
const AVATAR_BOUNDS = 180;    // keep the landing spot inside the walkable field
const MAX_SPEED = 42;
const BOOST_MULT = 2.6;
const CLIMB_SPEED = 18;
const BOARD_RADIUS = 8;

function buildShip() {
  const root = new THREE.Group();
  const hull = new THREE.Group();
  root.add(hull);

  const paint = new THREE.MeshStandardMaterial({ color: 0xe9e1d3, roughness: 0.38, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2330, roughness: 0.5, metalness: 0.6 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xf2b45a, roughness: 0.35, metalness: 0.7, emissive: 0xf2b45a, emissiveIntensity: 0.25 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd9a8, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.6, emissive: 0xff9a4a, emissiveIntensity: 0.18 });

  // Fuselage: tapered cylinder, nose toward -z
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.95, 4.6, 20), paint);
  body.rotation.x = -Math.PI / 2;
  hull.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), accent);
  nose.position.z = -2.35;
  hull.add(nose);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.28, 3.0), dark);
  belly.position.set(0, -0.5, 0.7);
  hull.add(belly);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.18, 20), accent);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.z = 0.4;
  hull.add(stripe);

  // Cockpit canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  canopy.scale.set(1, 0.85, 1.9);
  canopy.position.set(0, 0.42, -0.55);
  hull.add(canopy);

  // Swept wings
  const wingShape = (sign) => {
    const sh = new THREE.Shape();
    sh.moveTo(sign * 0.6, -0.5);
    sh.lineTo(sign * 3.5, 1.7);
    sh.lineTo(sign * 3.5, 2.2);
    sh.lineTo(sign * 0.6, 1.9);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  };
  [1, -1].forEach((sign) => {
    const wing = new THREE.Mesh(wingShape(sign), dark);
    wing.position.y = 0.05;
    hull.add(wing);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.6), accent);
    tip.position.set(sign * 3.5, 0, 1.95);
    hull.add(tip);
    const navLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: sign > 0 ? 0x6fe0a0 : 0xff6a6a })
    );
    navLight.position.set(sign * 3.55, 0.05, 1.7);
    hull.add(navLight);
  });

  // Tail fin
  const fin = new THREE.Shape();
  fin.moveTo(0, 0); fin.lineTo(1.2, 0); fin.lineTo(0.3, 1.3); fin.lineTo(0, 1.3); fin.closePath();
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.1, bevelEnabled: false });
  finGeo.rotateY(-Math.PI / 2);
  const tail = new THREE.Mesh(finGeo, paint);
  tail.position.set(0.05, 0.25, 2.5);
  hull.add(tail);

  // Engines + flames
  const flames = [];
  const flameMat = () => new THREE.MeshBasicMaterial({ color: 0xffb35a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  [-0.85, 0.85].forEach((x) => {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.5, 14), dark);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(x, -0.1, 2.0);
    hull.add(nacelle);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 20), accent);
    ring.position.set(x, -0.1, 2.78);
    hull.add(ring);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 14, 1, true), flameMat());
    flame.rotation.x = -Math.PI / 2; // tip pointing +z (backwards)
    flame.position.set(x, -0.1, 3.7);
    hull.add(flame);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.rotation.x = -Math.PI / 2;
    core.position.set(x, -0.1, 3.3);
    hull.add(core);
    flames.push({ flame, core, baseZ: 2.8 });
  });

  const light = new THREE.PointLight(0xffb070, 1.4, 14, 1.6);
  light.position.set(0, -1.2, 1.5);
  hull.add(light);

  root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return { root, hull, flames };
}

export class ShipController {
  constructor({ scene, camera, avatar, input }) {
    this.scene = scene;
    this.camera = camera;
    this.avatar = avatar;
    this.input = input;
    this.baseFov = camera.fov;
    this.boarded = false;
    this.available = true; // false while in a destination area
    this.near = false;
    this.heading = 0.45;
    this.speed = 0;
    this.vy = 0;
    this.roll = 0;
    this.pitchVis = 0;
    this.time = 0;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ship = buildShip();
    this.group = ship.root;
    this.hull = ship.hull;
    this.flames = ship.flames;
    this.group.position.set(7.5, 1.5, -2);
    this.group.rotation.y = this.heading;
    scene.add(this.group);

    // Landing pad
    this.pad = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 0.18, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a141f, roughness: 0.6, metalness: 0.5 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.07, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xf2b45a }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    this.pad.add(disc, ring);
    this.pad.position.set(7.5, 0.05, -2);
    scene.add(this.pad);

    this.buildUI();
    this.onDestination = (e) => this.setAvailable((e.detail?.destination || 'home') === 'home');
    window.addEventListener('portfolio:destination-change', this.onDestination);
  }

  /* ---------- UI ---------- */
  buildUI() {
    const ui = document.createElement('div');
    ui.id = 'ship-ui';
    ui.innerHTML = `
      <button id="ship-board-btn" type="button" hidden>Board ship <kbd>E</kbd></button>
      <div id="ship-hud" hidden>
        <div class="ship-readout"><span>Speed <b id="ship-speed">0</b></span><span>Altitude <b id="ship-alt">0</b></span></div>
        <p class="ship-keys"><kbd>W</kbd><kbd>S</kbd> throttle · <kbd>A</kbd><kbd>D</kbd> steer · <kbd>Space</kbd> climb · <kbd>C</kbd> dive · <kbd>Shift</kbd> boost · <kbd>E</kbd> land</p>
      </div>
      <div id="ship-touch" hidden>
        <button type="button" data-ship="up" aria-label="Climb">&#9650; Up</button>
        <button type="button" data-ship="down" aria-label="Dive">&#9660; Down</button>
        <button type="button" data-ship="boost" aria-label="Boost">Boost</button>
        <button type="button" data-ship="land" aria-label="Land and exit ship">Land</button>
      </div>`;
    document.body.appendChild(ui);
    this.ui = ui;
    this.boardBtn = ui.querySelector('#ship-board-btn');
    this.hud = ui.querySelector('#ship-hud');
    this.touch = ui.querySelector('#ship-touch');
    this.speedEl = ui.querySelector('#ship-speed');
    this.altEl = ui.querySelector('#ship-alt');
    this.boardBtn.addEventListener('click', () => this.board());

    const hold = (btn, key) => {
      const down = (e) => { e.preventDefault(); this.input.keys[key] = true; this.input.updateMovement(); };
      const up = (e) => { e.preventDefault(); this.input.keys[key] = false; this.input.updateMovement(); };
      btn.addEventListener('pointerdown', down);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => btn.addEventListener(n, up));
    };
    hold(ui.querySelector('[data-ship="up"]'), 'up');
    hold(ui.querySelector('[data-ship="down"]'), 'down');
    hold(ui.querySelector('[data-ship="boost"]'), 'sprint');
    ui.querySelector('[data-ship="land"]').addEventListener('click', () => this.disembark());
  }

  /* ---------- state ---------- */
  setAvailable(isHome) {
    this.available = isHome;
    this.group.visible = isHome;
    this.pad.visible = isHome;
    if (!isHome && this.boarded) this.disembark({ silent: true });
    if (!isHome) { this.near = false; this.boardBtn.hidden = true; }
  }

  /** Returns true if it consumed the E key. */
  handleInteract() {
    if (this.boarded) { this.disembark(); return true; }
    if (this.near) { this.board(); return true; }
    return false;
  }

  board() {
    if (this.boarded || !this.available) return;
    this.boarded = true;
    window.__shipFlying = true;
    this.avatar.root.visible = false;
    this.avatar.orbitAngles.yaw = 0;
    this.avatar.orbitAngles.pitch = 0.3;
    this.avatar.zoomDistance = Math.max(7.5, this.avatar.zoomDistance);
    this.avatar.cancelTransition?.();
    this.avatar.clearCameraFocus?.();
    document.getElementById('home-intro')?.classList.add('hidden');
    this.boardBtn.hidden = true;
    this.hud.hidden = false;
    this.touch.hidden = false;
    document.body.classList.add('ship-flying');
    window.dispatchEvent(new CustomEvent('portfolio:ship-board'));
  }

  disembark({ silent = false } = {}) {
    if (!this.boarded) return;
    this.boarded = false;
    window.__shipFlying = false;
    this.input.keys.up = this.input.keys.down = false;
    this.input.updateMovement();
    this.hud.hidden = true;
    this.touch.hidden = true;
    document.body.classList.remove('ship-flying');
    this.avatar.root.visible = true;
    this.speed = 0;
    this.vy = 0;
    this.hull.rotation.set(0, 0, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    const h = this.heading;
    const right = new THREE.Vector3(Math.cos(h), 0, -Math.sin(h));
    const p = this.group.position;
    if (!silent) {
      const clamp = (v) => Math.max(-AVATAR_BOUNDS, Math.min(AVATAR_BOUNDS, v));
      const ax = clamp(p.x + right.x * 5.5);
      const az = clamp(p.z + right.z * 5.5);
      this.avatar.root.position.set(ax, 0, az);
      this.avatar.velocity.set(0, 0, 0);
      this.avatar.root.rotation.y = h;
      this.avatar.orbitAngles.yaw = h;
      this.avatar.orbitAngles.pitch = 0.28;
      this.avatar.cameraCurrentPos.copy(this.camera.position);
      p.set(ax - right.x * 5.5, 1.5, az - right.z * 5.5);
    } else {
      p.y = 1.5;
    }
    this.pad.position.set(p.x, 0.05, p.z);
    window.dispatchEvent(new CustomEvent('portfolio:ship-land'));
  }

  /* ---------- per frame ---------- */
  update(delta) {
    this.time += delta;
    if (this.boarded) this.fly(delta);
    else this.idle(delta);
    this.animateFlames();
  }

  idle(delta) {
    if (!this.available) return;
    if (!this.reducedMotion) this.group.position.y = 1.5 + Math.sin(this.time * 1.4) * 0.12;
    const a = this.avatar.root.position;
    const p = this.group.position;
    const near = Math.hypot(a.x - p.x, a.z - p.z) < BOARD_RADIUS && this.avatar.root.visible;
    if (near !== this.near) {
      this.near = near;
      this.boardBtn.hidden = !near;
    }
  }

  fly(delta) {
    const input = this.input;
    const mv = input.moveVector;
    const boost = input.isSprinting;
    const p = this.group.position;

    const target = mv.y > 0.05 ? mv.y * MAX_SPEED * (boost ? BOOST_MULT : 1)
      : mv.y < -0.05 ? mv.y * MAX_SPEED * 0.4 : 0;
    const rate = Math.abs(mv.y) > 0.05 ? 1.6 : 0.7;
    this.speed += (target - this.speed) * (1 - Math.exp(-delta * rate));

    const turnScale = 0.45 + 0.55 * Math.min(1, Math.abs(this.speed) / 12);
    this.heading -= mv.x * 1.6 * turnScale * delta;

    const vert = (input.keys.up ? 1 : 0) - (input.keys.down ? 1 : 0);
    this.vy += (vert * CLIMB_SPEED - this.vy) * (1 - Math.exp(-delta * 3));

    const fx = -Math.sin(this.heading), fz = -Math.cos(this.heading);
    p.x += fx * this.speed * delta;
    p.z += fz * this.speed * delta;
    p.y += this.vy * delta;
    p.x = Math.max(-SHIP_BOUNDS, Math.min(SHIP_BOUNDS, p.x));
    p.z = Math.max(-SHIP_BOUNDS, Math.min(SHIP_BOUNDS, p.z));
    p.y = Math.max(1.4, Math.min(260, p.y));

    this.group.rotation.y = this.heading;
    const k = 1 - Math.exp(-delta * 5);
    this.roll += (-mv.x * 0.55 - this.roll) * k;
    this.pitchVis += ((this.vy / CLIMB_SPEED) * 0.22 - this.pitchVis) * k;
    this.hull.rotation.z = this.roll;
    this.hull.rotation.x = this.pitchVis;

    // keep the hidden explorer with the ship so proximity logic stays consistent
    this.avatar.root.position.set(p.x, p.y, p.z);

    // chase camera: drag to look around, recentres when released
    const orbit = this.avatar.orbitAngles;
    if (!input.isDraggingCamera) orbit.yaw += (0 - orbit.yaw) * (1 - Math.exp(-delta * 1.6));
    const camAngle = this.heading + orbit.yaw;
    const pitch = Math.max(0.05, Math.min(1.0, orbit.pitch));
    const dist = Math.max(9, this.avatar.zoomDistance * 1.5) + Math.abs(this.speed) * 0.06;
    const hDist = dist * Math.cos(pitch);
    const wantPos = new THREE.Vector3(
      p.x + Math.sin(camAngle) * hDist,
      p.y + 1.8 + dist * Math.sin(pitch),
      p.z + Math.cos(camAngle) * hDist
    );
    this.camera.position.lerp(wantPos, 1 - Math.exp(-delta * (this.reducedMotion ? 30 : 6)));
    this.camera.lookAt(p.x + fx * 10, p.y + 1.2, p.z + fz * 10);

    const wantFov = this.baseFov + (this.reducedMotion ? 0 : Math.min(1, Math.max(0, this.speed - MAX_SPEED) / (MAX_SPEED * 1.6)) * 14);
    if (Math.abs(this.camera.fov - wantFov) > 0.05) {
      this.camera.fov += (wantFov - this.camera.fov) * (1 - Math.exp(-delta * 4));
      this.camera.updateProjectionMatrix();
    }

    this.speedEl.textContent = Math.round(Math.abs(this.speed) * 3.6);
    this.altEl.textContent = Math.round(p.y);
  }

  animateFlames() {
    const power = this.boarded ? Math.min(1.6, 0.35 + Math.abs(this.speed) / MAX_SPEED * 0.9) : 0.25;
    const flicker = this.reducedMotion ? 1 : 0.9 + Math.sin(this.time * 40) * 0.1;
    this.flames.forEach((f) => {
      f.flame.scale.set(1, power * flicker, 1);
      f.core.scale.set(1, power * flicker, 1);
      f.flame.position.z = f.baseZ + 0.9 * power * flicker;
      f.core.position.z = f.baseZ + 0.55 * power * flicker;
    });
  }

  dispose() {
    window.removeEventListener('portfolio:destination-change', this.onDestination);
    window.__shipFlying = false;
    [this.group, this.pad].forEach((obj) => {
      obj.traverse((o) => {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => m.dispose?.());
      });
      this.scene.remove(obj);
    });
    this.ui.remove();
  }
}
