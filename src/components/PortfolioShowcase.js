import * as THREE from "three";

/* ────────────────────────────────────────────────────────────
   EDIT ME: all content lives here
   Videos: /assets/videos/   Music: /assets/audio/bd-music.mp3
   ──────────────────────────────────────────────────────────── */
const video = (file) => `/assets/videos/${encodeURIComponent(file)}`;

const PROJECTS = [
  { title: "EAT RIGHT RUN", badge: "Group Project", src: video("eat-right-run.mp4") },
  { title: "Parallax Effect", badge: "Solo Project", src: video("parallax.mp4") },
  { title: "3D Character for Portfolio", badge: "Solo Project", src: video("charmy1.mp4") },
  { title: "Minecraft Environment", badge: "Solo Project", src: video("minecraft.mp4") },
  { title: "Space Parallax", badge: "Solo Project", src: video("web-games1.mp4") },
  { title: "Babusar Top Poster in AfterEffects", badge: "Solo Project", src: video("poster_1.mp4") },
  { title: "VR Games Hub", badge: "Group Project", src: video("vrgames.mp4") },
  { title: "Tetris Game", badge: "Group Project", src: video("tetrisfast.mp4") },
  { title: "Development Company", badge: "Solo Project", src: video("Main.mp4") },
  { title: "Poster", badge: "Solo Project", src: video("marathon.mp4") },
  { title: "Tic Tac Toe", badge: "Group Project", src: video("tictactoe.mp4") },
  { title: "3D Character(in making)", badge: "Group Project", src: video("fypchar.mp4") },
];

const OWNER = {
  name: "Rafia Gull",
  role: "Game Developer - Unity - Blender - Unreal Engine",
  fullName: "Rafia Gull", // TODO: change if different
  links: [
    { label: "https://hyh-portfolio.vercel.app/", href: "https://hyh-portfolio.vercel.app/" }, // TODO
    { label: "https://github.com/RafiaSajid", href: "https://github.com/RafiaSajid" }, // TODO
    { label: "hayahsajid08@gmail.com", href: "hayahsajid08@gmail.com" }, // TODO
  ],
  cta: "Let’s build something together",
};

const BGM_SRC = "/assets/audio/bd-music.mp3";
const BADGE_COLORS = { "Group Project": "#ff8a4c", "Solo Project": "#2fd9c5" };
const DEFAULT_ACCENT = "#7c8cff";
const INTRO_MS = 4000;
const PROJECT_MS = 8000;
const OUTRO_MS = 4000;

const colorFor = (p) => (p && BADGE_COLORS[p.badge]) || DEFAULT_ACCENT;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ICON = {
  prev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 5 8 12l7.5 7z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m8.5 5 7.5 7-7.5 7z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
  muted: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 4V5L7 9zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 4V5L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
};

const CSS = `
.pfs-wrap{position:relative;width:100%;max-width:920px;margin:0 auto;aspect-ratio:16/9;min-height:380px;max-height:600px;
  overflow:hidden;border-radius:20px;isolation:isolate;
  background:radial-gradient(120% 120% at 20% 10%,#1b1f3a 0%,#0b0d1a 55%,#05060d 100%);
  box-shadow:0 20px 60px -20px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.08);
  color:#fff;touch-action:pan-y;container:pfs / inline-size;outline:none;-webkit-tap-highlight-color:transparent;}
.pfs-wrap:focus-visible{box-shadow:0 0 0 2px #7c8cff,0 20px 60px -20px rgba(0,0,0,.6);}
.pfs-canvas{position:absolute;inset:0;z-index:0;}
.pfs-shade{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(to top,rgba(5,6,13,.85) 0%,rgba(5,6,13,.35) 32%,rgba(5,6,13,0) 55%);}
.pfs-center{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:24px 20px 64px;gap:10px;animation:pfs-out .5s ease 3.5s forwards;pointer-events:none;}
.pfs-center a{pointer-events:auto;}
.pfs-name{margin:0;font-weight:800;letter-spacing:-.02em;line-height:1.05;font-size:clamp(2rem,10cqi,4.6rem);perspective:600px;}
.pfs-letter{display:inline-block;opacity:0;transform:translateY(60%) rotateX(-70deg);filter:blur(8px);
  animation:pfs-letter .8s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 55ms + 150ms);}
.pfs-role{margin:0;font-size:clamp(.8rem,2.6cqi,1.05rem);letter-spacing:.06em;opacity:0;color:#c9d0ff;animation:pfs-rise .7s ease 1s forwards;}
.pfs-links{margin:6px 0 0;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;font-size:clamp(.8rem,2.5cqi,1rem);
  opacity:0;animation:pfs-rise .7s ease .9s forwards;}
.pfs-links a{color:#e6e9ff;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.35);padding-bottom:1px;}
.pfs-links a:hover{border-color:#fff;}
.pfs-cta{margin:8px 0 0;font-size:clamp(.9rem,3cqi,1.2rem);font-weight:600;opacity:0;
  background:linear-gradient(90deg,#7c8cff,#2fd9c5);-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:pfs-rise .7s ease 1.4s forwards;}
.pfs-ui{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:flex-end;padding:18px 20px 22px;pointer-events:none;}
.pfs-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;}
.pfs-info{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:0;animation:pfs-rise .6s cubic-bezier(.2,.8,.2,1) both;}
.pfs-badge{--c:#7c8cff;display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:#06070f;background:var(--c);box-shadow:0 0 18px -2px var(--c);}
.pfs-title{margin:0;font-size:clamp(1.05rem,4cqi,1.75rem);font-weight:700;line-height:1.15;letter-spacing:-.01em;}
.pfs-count{font-size:.72rem;letter-spacing:.14em;opacity:.6;font-variant-numeric:tabular-nums;}
.pfs-controls{display:flex;gap:8px;pointer-events:auto;flex-shrink:0;}
.pfs-btn{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;cursor:pointer;color:#fff;padding:0;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  transition:background .2s,transform .2s;}
.pfs-btn:hover{background:rgba(255,255,255,.22);transform:translateY(-1px);}
.pfs-btn:focus-visible{outline:2px solid #7c8cff;outline-offset:2px;}
.pfs-bar{position:absolute;left:0;right:0;bottom:0;height:3px;z-index:4;background:rgba(255,255,255,.12);}
.pfs-bar-fill{height:100%;width:100%;transform-origin:left center;transform:scaleX(0);background:linear-gradient(90deg,#7c8cff,#2fd9c5);}
@container pfs (max-width:560px){
  .pfs-ui{padding:14px 14px 18px;}
  .pfs-bottom{flex-direction:column;align-items:flex-start;gap:12px;}
  .pfs-controls{width:100%;justify-content:flex-start;}
  .pfs-center{padding-bottom:70px;}
}
@keyframes pfs-letter{to{opacity:1;transform:none;filter:none;}}
@keyframes pfs-rise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
@keyframes pfs-out{to{opacity:0;transform:scale(1.04);}}
@media (prefers-reduced-motion:reduce){
  .pfs-letter,.pfs-role,.pfs-links,.pfs-cta,.pfs-info,.pfs-center{animation-duration:.01s;animation-delay:0s;}
}`;

/* ────────────────────────────────────────────────────────────
   mountShowcase(hostElement) → returns a destroy() function
   ──────────────────────────────────────────────────────────── */
export function mountShowcase(host) {
  if (!host) return () => { };

  if (!document.getElementById("pfs-styles")) {
    const st = document.createElement("style");
    st.id = "pfs-styles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const n = PROJECTS.length;
  const total = n + 2; // intro + projects + outro

  host.innerHTML = `
    <section class="pfs-wrap" tabindex="0" aria-roledescription="carousel" aria-label="Portfolio showcase">
      <div class="pfs-canvas" aria-hidden="true"></div>
      <div class="pfs-shade" aria-hidden="true"></div>
      <div class="pfs-stage"></div>
      <div class="pfs-ui"><div class="pfs-bottom">
        <div class="pfs-info-slot" aria-live="polite"></div>
        <div class="pfs-controls">
          <button class="pfs-btn" data-act="prev" aria-label="Previous">${ICON.prev}</button>
          <button class="pfs-btn" data-act="pause" aria-label="Pause">${ICON.pause}</button>
          <button class="pfs-btn" data-act="next" aria-label="Next">${ICON.next}</button>
          <button class="pfs-btn" data-act="mute" aria-label="Unmute" aria-pressed="false">${ICON.muted}</button>
        </div>
      </div></div>
      <div class="pfs-bar" aria-hidden="true"><div class="pfs-bar-fill"></div></div>
    </section>`;

  const wrap = host.querySelector(".pfs-wrap");
  const mount = host.querySelector(".pfs-canvas");
  const stage = host.querySelector(".pfs-stage");
  const infoSlot = host.querySelector(".pfs-info-slot");
  const bar = host.querySelector(".pfs-bar-fill");
  const btnPause = host.querySelector('[data-act="pause"]');
  const btnMute = host.querySelector('[data-act="mute"]');

  /* ---------- state ---------- */
  let step = 0;
  let elapsed = 0;
  let paused = false;
  let muted = true;
  const audio = { ctx: null, bgm: null };
  let sceneApi = null;

  /* ---------- overlay rendering ---------- */
  const letters = (text) =>
    Array.from(text)
      .map((ch, i) => `<span class="pfs-letter" style="--i:${i}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`)
      .join("");

  function renderOverlay() {
    const isIntro = step === 0;
    const isOutro = step === total - 1;
    stage.innerHTML = "";
    infoSlot.innerHTML = "";
    if (isIntro) {
      stage.innerHTML = `<div class="pfs-center">
        <h2 class="pfs-name" aria-label="${esc(OWNER.name)}">${letters(OWNER.name)}</h2>
        <p class="pfs-role">${esc(OWNER.role)}</p></div>`;
    } else if (isOutro) {
      stage.innerHTML = `<div class="pfs-center">
        <h2 class="pfs-name" aria-label="${esc(OWNER.fullName)}">${letters(OWNER.fullName)}</h2>
        <p class="pfs-links">${OWNER.links
          .map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`)
          .join("")}</p>
        <p class="pfs-cta">${esc(OWNER.cta)}</p></div>`;
    } else {
      const p = PROJECTS[step - 1];
      infoSlot.innerHTML = `<div class="pfs-info">
        <span class="pfs-badge" style="--c:${colorFor(p)}">${esc(p.badge)}</span>
        <h3 class="pfs-title">${esc(p.title)}</h3>
        <span class="pfs-count">${String(step).padStart(2, "0")} / ${String(n).padStart(2, "0")}</span></div>`;
    }
  }

  /* ---------- audio ---------- */
  function playWhoosh() {
    if (muted || !audio.ctx) return;
    const ctx = audio.ctx;
    try {
      const dur = 0.6;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.2;
      const t = ctx.currentTime;
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.7);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    } catch (e) {
      /* audio is optional */
    }
  }

  /* ---------- navigation / controls ---------- */
  function goTo(next) {
    const target = ((next % total) + total) % total;
    const prev = step;
    step = target;
    elapsed = 0;
    renderOverlay();
    if (sceneApi) sceneApi.onStep(target, prev);
    playWhoosh();
  }

  function togglePause() {
    paused = !paused;
    btnPause.innerHTML = paused ? ICON.play : ICON.pause;
    btnPause.setAttribute("aria-label", paused ? "Play" : "Pause");
    if (sceneApi) sceneApi.setPlaying(!paused);
    if (audio.bgm && !muted) {
      if (paused) audio.bgm.pause();
      else audio.bgm.play().catch(() => { });
    }
  }

  function toggleMute() {
    muted = !muted;
    btnMute.innerHTML = muted ? ICON.muted : ICON.sound;
    btnMute.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    btnMute.setAttribute("aria-pressed", String(!muted));
    if (!muted) {
      if (!audio.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audio.ctx = new AC();
      }
      if (audio.ctx) audio.ctx.resume().catch(() => { });
      if (!audio.bgm) {
        const el = new Audio(BGM_SRC);
        el.loop = true;
        el.volume = 0.35;
        audio.bgm = el;
      }
      if (!paused) audio.bgm.play().catch(() => { });
      playWhoosh();
    } else if (audio.bgm) {
      audio.bgm.pause();
    }
  }

  const onClick = (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "prev") goTo(step - 1);
    else if (act === "next") goTo(step + 1);
    else if (act === "pause") togglePause();
    else if (act === "mute") toggleMute();
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") goTo(step + 1);
    else if (e.key === "ArrowLeft") goTo(step - 1);
    else if (e.key === " " && e.target === wrap) {
      e.preventDefault();
      togglePause();
    }
  };
  wrap.addEventListener("click", onClick);
  wrap.addEventListener("keydown", onKeyDown);

  /* ---------- Three.js ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  mount.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 50);
  const BASE_Z = 6;
  camera.position.set(0, 0, BASE_Z);

  const accent = new THREE.Color(DEFAULT_ACCENT);
  const accentTarget = new THREE.Color(DEFAULT_ACCENT);

  // backdrop
  const small = window.matchMedia("(max-width: 640px)").matches;
  const COUNT = small ? 320 : 700;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  const wireGeo = new THREE.IcosahedronGeometry(2.4, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.16, depthWrite: false });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.position.set(0, 0, -3);
  scene.add(wire);

  const wire2Geo = new THREE.OctahedronGeometry(1.1, 0);
  const wire2Mat = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.14, depthWrite: false });
  const wire2 = new THREE.Mesh(wire2Geo, wire2Mat);
  wire2.position.set(3.4, -1.3, -2);
  scene.add(wire2);

  // video planes
  const W0 = 3.2, H0 = 1.8, PAD = 0.07;
  const planeGeo = new THREE.PlaneGeometry(W0 * (1 + 2 * PAD), H0 * (1 + 2 * PAD));
  const group = new THREE.Group();
  scene.add(group);

  const vertex = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const fragment = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform float uOpacity;
    uniform vec3 uGlow;
    const float PAD = ${PAD.toFixed(3)};
    const float ASPECT = 1.7778;
    const float R = 0.07;
    void main(){
      vec2 uv = (vUv - 0.5) * (1.0 + 2.0 * PAD) + 0.5;
      vec2 p = (uv - 0.5) * vec2(ASPECT, 1.0);
      vec2 b = vec2(ASPECT, 1.0) * 0.5;
      vec2 q = abs(p) - b + R;
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - R;
      float inside = 1.0 - smoothstep(-0.004, 0.004, d);
      vec3 vid = texture2D(uMap, clamp(uv, 0.0, 1.0)).rgb;
      float rim = smoothstep(-0.035, 0.0, d);
      float sheen = smoothstep(0.35, 0.0, abs((uv.x + uv.y * 0.6) - 0.9)) * 0.06;
      vec3 col = mix(vid, uGlow, rim * 0.5) + sheen;
      float glow = exp(-max(d, 0.0) * 22.0) * 0.5 * (1.0 - smoothstep(0.0, 0.065, max(d, 0.0)));
      vec3 outc = mix(uGlow, col, inside);
      gl_FragColor = vec4(outc, max(inside, glow) * uOpacity);
    }`;

  function makeSlot() {
    const v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    const tex = new THREE.VideoTexture(v);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uMap: { value: tex }, uOpacity: { value: 0 }, uGlow: { value: new THREE.Color(DEFAULT_ACCENT) } },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    return { video: v, tex, mat, mesh, project: -1, want: false, x: 0, tx: 0 };
  }
  const slots = [makeSlot(), makeSlot()];
  let active = 0;
  const timeouts = new Set();

  function loadInto(slot, idx) {
    if (slot.project === idx) return;
    slot.project = idx;
    slot.video.src = PROJECTS[idx].src;
    slot.video.load();
    if (!paused) slot.video.play().catch(() => { });
  }

  let kick = 0;
  let kickDir = 1;

  function onStep(s, prev) {
    const dir = s >= prev ? 1 : -1;
    kick = 1;
    kickDir = dir;
    const wasWanted = slots.map((sl) => sl.want);
    slots.forEach((sl) => {
      if (sl.want) sl.tx = -dir * 1.4;
      sl.want = false;
    });

    if (s >= 1 && s <= n) {
      const idx = s - 1;
      accentTarget.set(colorFor(PROJECTS[idx]));
      let target = slots.find((sl) => sl.project === idx);
      if (!target) {
        target = slots[1 - active];
        loadInto(target, idx);
      }
      const ti = slots.indexOf(target);
      if (!wasWanted[ti]) target.x = dir * 1.4;
      target.tx = 0;
      target.want = true;
      if (!paused) target.video.play().catch(() => { });
      active = ti;

      if (idx + 1 < n) {
        const id = window.setTimeout(() => {
          timeouts.delete(id);
          const other = slots[1 - active];
          if (!other.want && other.project !== idx + 1) loadInto(other, idx + 1);
        }, 1200);
        timeouts.add(id);
      }
    } else {
      accentTarget.set(DEFAULT_ACCENT);
      if (s === 0 && !slots.some((sl) => sl.project === 0)) loadInto(slots[1 - active], 0);
    }
  }

  function setPlaying(p) {
    slots.forEach((sl) => {
      if (sl.project < 0) return;
      if (p && sl.want) sl.video.play().catch(() => { });
      else sl.video.pause();
    });
  }
  sceneApi = { onStep, setPlaying };

  // sizing, driven by the wrapper (not the window)
  let layoutY = 0;
  function layout(w, h) {
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const vh = 2 * BASE_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vw = vh * aspect;
    const narrow = aspect < 1.3 || w < 560;
    const availW = vw * 0.9;
    const availH = vh * (narrow ? 0.46 : 0.68);
    group.scale.setScalar(Math.min(availW / W0, availH / H0));
    layoutY = narrow ? vh * 0.17 : vh * 0.07;
    points.scale.set(Math.max(0.45, Math.min(1, aspect / 1.78)), 1, 1);
    wire.scale.setScalar(Math.min(1.2, Math.max(0.55, (vh / 4.3) * (narrow ? 0.75 : 1))));
    wire2.scale.setScalar(narrow ? 0.6 : 1);
    wire2.position.x = Math.min(3.4, vw * 0.38);
  }

  const ro = new ResizeObserver((entries) => {
    const r = entries[0].contentRect;
    if (r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    layout(r.width, r.height);
  });
  ro.observe(wrap);
  {
    const r = wrap.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) {
      renderer.setSize(r.width, r.height, false);
      layout(r.width, r.height);
    }
  }

  // pointer / touch parallax
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const onMove = (e) => {
    const rect = wrap.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const onLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  wrap.addEventListener("pointermove", onMove, { passive: true });
  wrap.addEventListener("pointerleave", onLeave);
  wrap.addEventListener("pointercancel", onLeave);
  wrap.addEventListener("pointerup", onLeave);

  // pause while offscreen
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) slots.forEach((sl) => sl.video.pause());
      else if (!paused) slots.forEach((sl) => sl.want && sl.video.play().catch(() => { }));
    },
    { threshold: 0.05 }
  );
  io.observe(wrap);

  // main loop
  let raf = 0;
  let last = performance.now();
  let t = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible || document.hidden) return;
    t += dt;

    const dur = step === 0 ? INTRO_MS : step === n + 1 ? OUTRO_MS : PROJECT_MS;
    if (!paused) {
      elapsed += dt * 1000;
      if (elapsed >= dur) goTo(step + 1);
    }
    const dur2 = step === 0 ? INTRO_MS : step === n + 1 ? OUTRO_MS : PROJECT_MS;
    bar.style.transform = `scaleX(${Math.min(elapsed / dur2, 1)})`;

    accent.lerp(accentTarget, 1 - Math.exp(-dt * 3));
    wireMat.color.copy(accent);
    wire2Mat.color.copy(accent);

    const k = 1 - Math.exp(-dt * 4);
    smooth.x += (pointer.x - smooth.x) * k;
    smooth.y += (pointer.y - smooth.y) * k;

    for (const s of slots) {
      const ready = s.video.readyState >= 2;
      const tgt = s.want && ready ? 1 : 0;
      const o = s.mat.uniforms.uOpacity.value;
      const no = o + (tgt - o) * (1 - Math.exp(-dt * 5));
      s.mat.uniforms.uOpacity.value = no;
      s.mat.uniforms.uGlow.value.copy(accent);
      s.x += (s.tx - s.x) * (1 - Math.exp(-dt * 4.5));
      s.mesh.position.set(s.x, 0, -Math.abs(s.x) * 0.4);
      s.mesh.rotation.y = -s.x * 0.25;
      s.mesh.visible = no > 0.01;
    }

    group.position.y = layoutY + Math.sin(t * 0.9) * 0.05;
    group.rotation.y = -0.12 + smooth.x * 0.14;
    group.rotation.x = 0.04 - smooth.y * 0.09;

    points.rotation.y = t * 0.02 + smooth.x * 0.1;
    points.position.x = smooth.x * 0.25;
    wire.rotation.x = t * 0.08;
    wire.rotation.y = t * 0.11 + smooth.x * 0.3;
    wire2.rotation.x = -t * 0.15;
    wire2.rotation.y = t * 0.12;

    kick *= Math.exp(-dt * 3);
    camera.position.set(smooth.x * 0.25, smooth.y * 0.15, BASE_Z - kick * 0.6);
    camera.lookAt(0, 0, 0);
    camera.rotateZ(kick * kickDir * 0.035);

    renderer.render(scene, camera);
  }

  renderOverlay();
  onStep(0, 0);
  raf = requestAnimationFrame(tick);

  /* ---------- cleanup ---------- */
  return function destroy() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    wrap.removeEventListener("click", onClick);
    wrap.removeEventListener("keydown", onKeyDown);
    wrap.removeEventListener("pointermove", onMove);
    wrap.removeEventListener("pointerleave", onLeave);
    wrap.removeEventListener("pointercancel", onLeave);
    wrap.removeEventListener("pointerup", onLeave);
    timeouts.forEach((id) => window.clearTimeout(id));
    timeouts.clear();
    slots.forEach((s) => {
      s.video.pause();
      s.video.removeAttribute("src");
      s.video.load();
      s.tex.dispose();
      s.mat.dispose();
    });
    planeGeo.dispose();
    pGeo.dispose();
    pMat.dispose();
    wireGeo.dispose();
    wireMat.dispose();
    wire2Geo.dispose();
    wire2Mat.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    if (audio.bgm) audio.bgm.pause();
    if (audio.ctx) audio.ctx.close().catch(() => { });
    host.innerHTML = "";
  };
}
