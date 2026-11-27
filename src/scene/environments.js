import * as THREE from 'three';

/* ------------------------------------------------------------------
   Procedural space helpers (no external assets)
   ------------------------------------------------------------------ */
const isSmall = () => window.matchMedia?.('(max-width: 640px)').matches;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeValueNoise(seed, grid = 16) {
  const r = rng(seed);
  const lattice = new Float32Array(grid * grid);
  for (let i = 0; i < lattice.length; i++) lattice[i] = r();
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const g = (a, b) => lattice[(((b % grid) + grid) % grid) * grid + (((a % grid) + grid) % grid)];
    const top = g(xi, yi) + (g(xi + 1, yi) - g(xi, yi)) * xf;
    const bot = g(xi, yi + 1) + (g(xi + 1, yi + 1) - g(xi, yi + 1)) * xf;
    return top + (bot - top) * yf;
  };
}

/** Soft coloured gas-cloud texture with alpha. */
export function makeNebulaTexture({ colors, seed = 1, size = 192, coverage = 0.42 }) {
  const noise = makeValueNoise(seed);
  const noise2 = makeValueNoise(seed + 77);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const cols = colors.map((c) => new THREE.Color(c));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let n = 0, amp = 0.5, f = 3;
      for (let o = 0; o < 4; o++) { n += noise(u * f + o * 3.1, v * f + o * 1.7) * amp; amp *= 0.5; f *= 2; }
      const dx = u - 0.5, dy = v - 0.5;
      const mask = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
      const a = Math.min(1, Math.max(0, (n - coverage) * 3.2)) * mask * mask;
      const t = noise2(u * 4, v * 4);
      const c = cols[0].clone().lerp(cols[1], t).lerp(cols[2] || cols[1], Math.max(0, n - 0.55) * 2);
      const i = (y * size + x) * 4;
      img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255;
      img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/** Procedural banded/terrain planet lit from a world-space direction, with fresnel rim. */
export function createPlanetMaterial({ c1, c2, c3, rim, bands = 6, seed = 1, noiseScale = 2.2, ice = 0 }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uC1: { value: new THREE.Color(c1) },
      uC2: { value: new THREE.Color(c2) },
      uC3: { value: new THREE.Color(c3) },
      uRim: { value: new THREE.Color(rim) },
      uLightDir: { value: new THREE.Vector3(0.6, 0.5, 0.6).normalize() },
      uBands: { value: bands },
      uSeed: { value: seed },
      uNoise: { value: noiseScale },
      uBoost: { value: 0 },
      uIce: { value: ice }
    },
    vertexShader: `
      varying vec3 vObj; varying vec3 vN; varying vec3 vV; varying vec3 vL;
      uniform vec3 uLightDir;
      void main() {
        vObj = position;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        vL = normalize((viewMatrix * vec4(uLightDir, 0.0)).xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vObj; varying vec3 vN; varying vec3 vV; varying vec3 vL;
      uniform vec3 uC1, uC2, uC3, uRim; uniform float uBands, uSeed, uNoise, uBoost, uIce;
      float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x){
        vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
      void main() {
        vec3 p = normalize(vObj);
        float n = fbm(p * uNoise + uSeed);
        float band = sin(p.y * uBands + n * 3.2) * 0.5 + 0.5;
        vec3 col = mix(uC1, uC2, band);
        col = mix(col, uC3, smoothstep(0.55, 0.85, n));
        col = mix(col, vec3(0.92, 0.97, 1.0), uIce * smoothstep(0.72, 0.95, abs(p.y)));
        vec3 N = normalize(vN);
        float diff = max(dot(N, normalize(vL)), 0.0);
        float fres = pow(1.0 - max(dot(N, normalize(vV)), 0.0), 2.6);
        vec3 lit = col * (0.16 + 1.0 * diff) + uRim * fres * (0.3 + 0.9 * diff);
        lit += col * uBoost * 0.35 + uRim * uBoost * fres * 0.6;
        gl_FragColor = vec4(lit, 1.0);
      }`
  });
}

function createAtmosphere(radius, color, strength = 1) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uStrength;
      void main(){ float f = pow(max(dot(-normalize(vN), normalize(vV)), 0.0), 3.0); gl_FragColor = vec4(uColor, f * 0.85 * uStrength); }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.12, 48, 32), mat);
}

function ringGeometry(inner, outer, segments = 96) {
  const geo = new THREE.RingGeometry(inner, outer, segments, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, (r - inner) / (outer - inner), 0.5);
  }
  return geo;
}

function makeRingTexture(color, seed = 3) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 4;
  const ctx = canvas.getContext('2d');
  const r = rng(seed);
  const c = new THREE.Color(color);
  for (let x = 0; x < 256; x++) {
    const a = Math.max(0, 0.15 + r() * 0.7) * Math.sin((x / 256) * Math.PI) ** 0.6;
    ctx.fillStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a})`;
    ctx.fillRect(x, 0, 1, 4);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Full planet: shader body + atmosphere + optional ring. */
export function createPlanet({ radius, palette, atmosphere, ring, seed = 1, bands = 6, ice = 0, noiseScale = 2.2 }) {
  const group = new THREE.Group();
  const material = createPlanetMaterial({ ...palette, seed, bands, ice, noiseScale });
  const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), material);
  group.add(body);
  if (atmosphere) group.add(createAtmosphere(radius, atmosphere));
  let ringMesh = null;
  if (ring) {
    const map = makeRingTexture(ring.color, seed + 9);
    ringMesh = new THREE.Mesh(
      ringGeometry(radius * ring.inner, radius * ring.outer),
      new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.85, fog: false })
    );
    ringMesh.rotation.x = Math.PI / 2 + (ring.tilt ?? 0.4);
    group.add(ringMesh);
  }
  return { group, body, material, ring: ringMesh };
}

function starLayer({ count, radius, spread, size, colors, opacity, seed }) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const palette = colors.map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1), d = radius + r() * spread;
    pos[i * 3] = d * Math.sin(v) * Math.cos(u);
    pos[i * 3 + 1] = d * Math.cos(v);
    pos[i * 3 + 2] = d * Math.sin(v) * Math.sin(u);
    const c = palette[Math.floor(r() * palette.length)];
    const k = 0.55 + r() * 0.45;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity, depthWrite: false, fog: false,
    sizeAttenuation: false, map: makeGlowTexture(), blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geo, mat);
}

function spiralGalaxy({ count, radius, arms = 3, core = 0xffd9a0, edge = 0x7fb0ff, seed = 5, size = 2.4 }) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const cc = new THREE.Color(core), ce = new THREE.Color(edge);
  for (let i = 0; i < count; i++) {
    const dist = Math.pow(r(), 0.65) * radius;
    const arm = (i % arms) * ((Math.PI * 2) / arms);
    const angle = arm + dist * 0.045 + (r() - 0.5) * 0.55;
    const thick = (r() - 0.5) * radius * 0.06 * (1 - dist / radius + 0.2);
    pos[i * 3] = Math.cos(angle) * dist;
    pos[i * 3 + 1] = thick;
    pos[i * 3 + 2] = Math.sin(angle) * dist;
    const c = cc.clone().lerp(ce, Math.min(1, dist / radius));
    const k = 0.5 + r() * 0.5;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, fog: false,
    map: makeGlowTexture(), blending: THREE.AdditiveBlending
  }));
}

function nebulaSprites({ palettes, count, radius, scale, opacity, seed }) {
  const r = rng(seed);
  const group = new THREE.Group();
  const textures = palettes.map((colors, i) => makeNebulaTexture({ colors, seed: seed + i * 13, size: isSmall() ? 128 : 192 }));
  for (let i = 0; i < count; i++) {
    const tex = textures[i % textures.length];
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: opacity * (0.6 + r() * 0.5), depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false, rotation: r() * Math.PI * 2
    });
    const s = new THREE.Sprite(mat);
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1);
    s.position.set(radius * Math.sin(v) * Math.cos(u), radius * Math.cos(v) * 0.6, radius * Math.sin(v) * Math.sin(u));
    s.scale.setScalar(scale * (0.7 + r() * 0.8));
    group.add(s);
  }
  return group;
}

/* ------------------------------------------------------------------
   Environment definitions: each has its own sky, lighting and colours
   ------------------------------------------------------------------ */
const ENVIRONMENTS = {
  home: {
    bg: { dark: 0x07050c, light: 0x0f0a16 }, fog: 0x07050c, fogDensity: 0.0035,
    ambientScale: 1, sunScale: 1, rimScale: 1,
    /** Real, reachable bodies in the home universe (they do not follow the player). */
    buildWorld() {
      const defs = [
        { pos: [290, 60, -310], radius: 48, seed: 4, bands: 8, atmo: 0xff9ac0, light: [-1, 0.4, 0.8],
          pal: { c1: 0x5a2a6f, c2: 0xd98aa8, c3: 0xf5dcc8, rim: 0xffb0c8 }, ring: { color: 0xf2d9a8, inner: 1.35, outer: 2.1, tilt: 0.5 } },
        { pos: [-330, 20, 210], radius: 36, seed: 8, bands: 5, atmo: 0xffb36b, light: [1, 0.3, -0.5],
          pal: { c1: 0x8a3b24, c2: 0xe0a05a, c3: 0x5a2418, rim: 0xffb36b } },
        { pos: [120, -40, 340], radius: 26, seed: 15, bands: 3, atmo: 0x7affd0, noise: 3, light: [0.3, 0.6, -1],
          pal: { c1: 0x1f6f55, c2: 0x7fe0b0, c3: 0xdff7ee, rim: 0x7affd0 } },
        { pos: [-230, 90, -350], radius: 15, seed: 21, bands: 2, noise: 4, ice: 1, light: [1, 0.2, 0.6],
          pal: { c1: 0x8a94a0, c2: 0xe8edf2, c3: 0x5a6470, rim: 0xffe6d0 } }
      ];
      return defs.map((d) => {
        const planet = createPlanet({ radius: d.radius, palette: d.pal, atmosphere: d.atmo, ring: d.ring, seed: d.seed, bands: d.bands, ice: d.ice || 0, noiseScale: d.noise || 2.2 });
        planet.group.position.set(...d.pos);
        planet.material.uniforms.uLightDir.value.set(...d.light).normalize();
        planet.group.userData.spinBody = planet.body;
        return planet.group;
      });
    },
    build() {
      const sky = new THREE.Group();
      const layers = [];
      const small = isSmall();
      layers.push({ f: 1, obj: starLayer({ count: small ? 900 : 2200, radius: 420, spread: 60, size: 1.6, colors: [0xe9f2ff, 0x9ec8ff, 0xffe2b0], opacity: 0.85, seed: 11 }) });
      layers.push({ f: 0.97, obj: starLayer({ count: small ? 300 : 700, radius: 300, spread: 60, size: 2.4, colors: [0xffffff, 0xcfe4ff], opacity: 0.9, seed: 12 }) });
      layers.push({ f: 1, obj: nebulaSprites({ palettes: [[0x5a1f6f, 0xd94a8a, 0x2a1060], [0x8a3a1f, 0xf2a45a, 0x3a1030], [0x1d5a5f, 0x6fd1b0, 0x10303a]], count: small ? 5 : 8, radius: 380, scale: 340, opacity: 0.5, seed: 21 }) });
      const galaxy = spiralGalaxy({ count: small ? 2500 : 6000, radius: 150, seed: 31 });
      galaxy.position.set(-190, 140, -330);
      galaxy.rotation.set(0.9, 0.3, 0.4);
      layers.push({ f: 1, obj: galaxy, spin: 0.01 });
      return { sky, layers };
    }
  },

  skills: {
    bg: { dark: 0x070408, light: 0x120a10 }, fog: 0x0a0609, fogDensity: 0.0012,
    ambientScale: 0.8, sunScale: 0.12, rimScale: 0.4,
    build() {
      const sky = new THREE.Group();
      const layers = [];
      const small = isSmall();
      layers.push({ f: 1, obj: starLayer({ count: small ? 1200 : 3000, radius: 400, spread: 70, size: 1.7, colors: [0xfff4e0, 0xffd9a0, 0xbcd6ff], opacity: 0.9, seed: 41 }) });
      layers.push({ f: 1, obj: nebulaSprites({ palettes: [[0x8a3a14, 0xd9822b, 0x5a1f0a], [0x2a4a8f, 0x6a3a2a, 0xf0a860]], count: small ? 4 : 6, radius: 390, scale: 380, opacity: 0.42, seed: 51 }) });
      const galaxy = spiralGalaxy({ count: small ? 2000 : 4500, radius: 120, core: 0xffc27a, edge: 0xff8a5a, seed: 61 });
      galaxy.position.set(260, 180, 260);
      galaxy.rotation.set(1.1, 0.2, -0.5);
      layers.push({ f: 1, obj: galaxy, spin: 0.008 });
      return { sky, layers };
    }
  },

  projects: {
    bg: { dark: 0x030a09, light: 0x08140f }, fog: 0x061412, fogDensity: 0.0016,
    ambientScale: 1.3, sunScale: 0.6, rimScale: 1.2,
    build() {
      const sky = new THREE.Group();
      const layers = [];
      const small = isSmall();
      layers.push({ f: 1, obj: starLayer({ count: small ? 900 : 2200, radius: 420, spread: 50, size: 1.5, colors: [0xdff6ff, 0x8fe3ff, 0xffffff], opacity: 0.85, seed: 71 }) });
      layers.push({ f: 1, obj: nebulaSprites({ palettes: [[0x0d6a5a, 0x34d6b0, 0x063a3a], [0x1f5a3a, 0x7ae0a0, 0x0a2a1a], [0x0f4f5f, 0x4fc0b0, 0x062a30]], count: small ? 5 : 8, radius: 380, scale: 360, opacity: 0.46, seed: 81 }) });
      const giant = createPlanet({ radius: 120, seed: 19, bands: 10, atmosphere: 0x6fe0c0,
        palette: { c1: 0x0f4f4a, c2: 0x3ab8a0, c3: 0xd8fff0, rim: 0x6fe0c0 }, ring: { color: 0xcfeee4, inner: 1.3, outer: 2.2, tilt: 0.35 } });
      giant.group.position.set(-230, 90, -300);
      layers.push({ f: 1, obj: giant.group, spin: 0.003, lightFrom: new THREE.Vector3(1, 0.5, 0.6) });
      const moon = createPlanet({ radius: 24, seed: 23, bands: 2, noiseScale: 4,
        palette: { c1: 0x6a7480, c2: 0xb8c2cc, c3: 0x3a424c, rim: 0xcfe8ff } });
      moon.group.position.set(210, 60, -260);
      layers.push({ f: 1, obj: moon.group, spin: 0.01, lightFrom: new THREE.Vector3(-1, 0.4, 0.5) });
      return { sky, layers };
    }
  },

  about: {
    bg: { dark: 0x070412, light: 0x120a22 }, fog: 0x0a0618, fogDensity: 0.0018,
    ambientScale: 1.1, sunScale: 0.5, rimScale: 1.4,
    build() {
      const sky = new THREE.Group();
      const layers = [];
      const small = isSmall();
      layers.push({ f: 1, obj: starLayer({ count: small ? 700 : 1600, radius: 420, spread: 50, size: 1.4, colors: [0xffe6f2, 0xd9c6ff, 0xffffff], opacity: 0.8, seed: 91 }) });
      layers.push({ f: 1, obj: nebulaSprites({ palettes: [[0x6a1f8f, 0xd94a9a, 0x2a1060], [0x8f2a5a, 0xf08ab8, 0x3a1060], [0x3a2a8f, 0x9a6af0, 0x1a1060]], count: small ? 5 : 9, radius: 370, scale: 380, opacity: 0.5, seed: 101 }) });
      const moon = createPlanet({ radius: 70, seed: 33, bands: 2, noiseScale: 5, atmosphere: 0xffc6e0,
        palette: { c1: 0x8a7f95, c2: 0xe8dff0, c3: 0x4a3f55, rim: 0xffc6e0 } });
      moon.group.position.set(240, 120, -260);
      layers.push({ f: 1, obj: moon.group, spin: 0.006, lightFrom: new THREE.Vector3(-1, 0.2, 0.8) });
      const debris = starLayer({ count: small ? 200 : 500, radius: 160, spread: 80, size: 3, colors: [0xffd0e8, 0xcdb6ff], opacity: 0.6, seed: 111 });
      layers.push({ f: 0.9, obj: debris, spin: 0.02 });
      return { sky, layers };
    }
  }
};

/* ------------------------------------------------------------------
   Manager: owns the skyboxes, swaps them per destination, keeps the
   single WebGL renderer/scene, hides everything not in the active area.
   ------------------------------------------------------------------ */
export class EnvironmentManager {
  constructor({ scene, spaceScene, landmarks, worldJourneys, avatar, refreshTheme }) {
    this.scene = scene;
    this.spaceScene = spaceScene;
    this.landmarks = landmarks;
    this.worldJourneys = worldJourneys;
    this.avatar = avatar;
    this.refreshTheme = refreshTheme;
    this.themeName = 'dark';
    this.active = 'home';
    this.built = {};
    this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.skyRoot = new THREE.Group();
    this.skyRoot.name = 'Environment skyboxes';
    this.scene.add(this.skyRoot);

    // Stars from the original scene must not fade into fog.
    if (spaceScene.starMaterial) spaceScene.starMaterial.fog = false;

    this.onDestinationChange = (event) => this.activate(event.detail?.destination || 'home');
    window.addEventListener('portfolio:destination-change', this.onDestinationChange);
    this.activate('home', { skipRefresh: true });
  }

  ensureBuilt(id) {
    if (this.built[id]) return this.built[id];
    const def = ENVIRONMENTS[id];
    const { sky, layers } = def.build();
    sky.name = `${id} sky`;
    layers.forEach((layer) => {
      layer.holder = new THREE.Group();
      layer.holder.add(layer.obj);
      sky.add(layer.holder);
      layer.obj.traverse?.((o) => { o.frustumCulled = false; });
    });
    sky.visible = false;
    this.skyRoot.add(sky);
    const world = def.buildWorld ? def.buildWorld() : [];
    world.forEach((g) => { g.visible = false; this.scene.add(g); });
    this.built[id] = { def, sky, layers, world };
    return this.built[id];
  }

  setThemeName(name) { this.themeName = name === 'light' ? 'light' : 'dark'; }

  activate(id, { skipRefresh = false } = {}) {
    if (!ENVIRONMENTS[id]) id = 'home';
    this.active = id;
    this.ensureBuilt(id);
    Object.entries(this.built).forEach(([key, env]) => {
      env.sky.visible = key === id;
      env.world.forEach((g) => { g.visible = key === id; });
    });

    const home = id === 'home';
    const sp = this.spaceScene;
    if (sp.stars) sp.stars.visible = home;
    if (sp.pathGroup) sp.pathGroup.visible = home;
    sp.planets?.forEach((p) => { p.visible = home; });
    sp.asteroids?.forEach((a) => { a.mesh.visible = home; });
    sp.nebulaPlanes?.forEach((p) => { p.visible = home; });
    if (this.landmarks.homeGroup) this.landmarks.homeGroup.visible = home;
    Object.entries(this.worldJourneys?.destinations || {}).forEach(([key, area]) => {
      if (area?.group) area.group.visible = key === id;
    });
    if (!skipRefresh) this.refreshTheme?.();
  }

  /** Called after the theme manager writes shared values; overlays per-environment look. */
  applyOverlay() {
    const def = ENVIRONMENTS[this.active];
    if (!def) return;
    if (this.active !== 'home') {
      this.scene.background.setHex(def.bg[this.themeName]);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(def.fog);
        this.scene.fog.density = def.fogDensity;
      }
    }
    const sp = this.spaceScene;
    sp.ambientLight.intensity *= def.ambientScale;
    sp.sunLight.intensity *= def.sunScale;
    sp.rimLight.intensity *= def.rimScale;
  }

  update(delta, playerPos) {
    const env = this.built[this.active];
    if (!env) return;
    if (!this.reduceMotion) env.world.forEach((g) => { if (g.userData.spinBody) g.userData.spinBody.rotation.y += delta * 0.02; });
    env.layers.forEach((layer) => {
      layer.holder.position.set(playerPos.x * layer.f, playerPos.y * layer.f, playerPos.z * layer.f);
      if (layer.spin && !this.reduceMotion) layer.obj.rotation.y += delta * layer.spin;
      if (layer.lightFrom) {
        layer.obj.traverse((o) => {
          if (o.material?.uniforms?.uLightDir) o.material.uniforms.uLightDir.value.copy(layer.lightFrom).normalize();
        });
      }
    });
  }

  dispose() {
    window.removeEventListener('portfolio:destination-change', this.onDestinationChange);
    Object.values(this.built).forEach((env) => env.world.forEach((g) => { this.scene.remove(g); g.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }));
    this.skyRoot.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
    });
    this.scene.remove(this.skyRoot);
    this.built = {};
  }
}
