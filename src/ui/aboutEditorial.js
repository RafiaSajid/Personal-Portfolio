import { portfolioData } from '../data/portfolioData.js';
import { ContactManager } from '../contact/contactManager.js';
import { FooterManager } from './footerManager.js';

window.__edReady = true;

/* Which projects are team work and which are solo. Only records the owner has
   labelled are sorted; everything else appears under "Also in the archive".
   Edit this object to move a project. */
const PROJECT_MODE = {
  'vr-games-hub': 'team',
  'eat-right-run': 'team',
  'study-planner-tracker': 'team',
  '3D Charcter': 'solo',
  'parallax-the-space-of-space': 'solo'
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const pad = (n) => String(n).padStart(2, '0');
const isVideo = (url) => /\.(mp4|webm)(\?.*)?$/i.test(url || '');
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>';

const { profile, education, skills, certifications = [], projects } = portfolioData;
const sorted = [...projects].sort((a, b) => (a.order || 99) - (b.order || 99));

/* ---------- Media helpers ---------- */
function typeFallback(project) {
  const box = el('div', 'ed-type-fallback');
  box.append(el('span', '', project.category), el('strong', '', project.title));
  return box;
}

function buildMedia(project, { lazyVideo = true } = {}) {
  if (isVideo(project.videoUrl)) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', `${project.title} preview video`);
    v.dataset.src = project.videoUrl;
    return v;
  }
  if (project.thumbnail) {
    const img = document.createElement('img');
    img.src = project.thumbnail;
    img.alt = `${project.title} preview`;
    img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(typeFallback(project)), { once: true });
    return img;
  }
  return typeFallback(project);
}

function loadVideo(v) {
  if (!v || v.tagName !== 'VIDEO') return;
  if (!v.src && v.dataset.src) { v.src = `${v.dataset.src}#t=0.1`; v.preload = 'metadata'; }
}
function playVideo(v) { if (v?.tagName === 'VIDEO') { loadVideo(v); v.play().catch(() => {}); } }
function stopVideo(v) { if (v?.tagName === 'VIDEO') v.pause(); }

/* ---------- Static content from data ---------- */
function renderFacts() {
  const set = (key, value) => { const n = $(`[data-fact="${key}"]`); if (n) n.textContent = value; };
  set('degree', education.degree);
  set('specialization', education.specialization.replace(/^Specialization in /, ''));
  set('status', education.status);
  set('location', education.location);
  set('certs', certifications.map((c) => `${c.title}, ${c.issuer}`).join(' and '));
}

function renderMarquee() {
  const tools = [...new Set(skills.flatMap((g) => g.items.map((s) => s.name)))];
  tools.push('NED University', 'CEGA certified');
  const rows = { tools, projects: sorted.map((p) => p.title) };
  Object.entries(rows).forEach(([key, items]) => {
    const row = $(`[data-marquee="${key}"]`);
    if (!row) return;
    for (let copy = 0; copy < 2; copy += 1) {
      const set = el('div', 'ed-marquee-set');
      if (copy) set.setAttribute('aria-hidden', 'true');
      [...items, ...items].forEach((label) => set.append(el('span', 'ed-marquee-item', label)));
      row.append(set);
    }
  });
}

function renderSkills() {
  const root = $('#skills-index');
  skills.forEach((group) => {
    const row = el('div', 'ed-skill-row');
    const heading = el('h3', 'title-3', group.category);
    const names = el('p', 'ed-skill-names');
    group.items.forEach((item) => {
      const s = el('span', '', item.name);
      s.title = item.desc || '';
      names.append(s);
    });
    row.append(heading, names);
    root.append(row);
  });
}

function renderContactLinks() {
  const list = $('#contact-links');
  const links = [
    ['GitHub', profile.contact?.githubUrl],
    ['LinkedIn', profile.contact?.linkedinUrl]
  ].filter(([, url]) => url);
  links.forEach(([label, url]) => {
    const li = el('li');
    const a = el('a', 'title-3');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.dataset.roll = '';
    a.textContent = label;
    a.insertAdjacentHTML('beforeend', ARROW);
    li.append(a);
    list.append(li);
  });
}

/* ---------- Featured work: sticky, scroll driven ---------- */
function renderFeatured() {
  const featured = sorted.filter((p) => p.featured);
  const stepsRoot = $('#feature-steps');
  const mediaRoot = $('#feature-media');
  const counter = $('#feature-count');
  const bar = $('#feature-bar');
  const layers = [];
  const steps = [];

  featured.forEach((project, i) => {
    const step = el('article', 'ed-step');
    step.dataset.index = i;
    step.append(el('span', 'ed-step-n', `${pad(i + 1)}`));
    step.append(el('h3', 'heading-3', project.title));
    step.append(el('p', 'caption-3 ed-muted', project.category));
    step.append(el('p', 'body-3', project.summary));
    if (project.contribution) {
      const mine = el('p', 'body-6');
      mine.append(el('strong', '', 'My part. '), document.createTextNode(project.contribution));
      step.append(mine);
    }
    const chips = el('div', 'ed-chips');
    (project.technologies || []).forEach((t) => chips.append(el('span', 'ed-chip', t)));
    step.append(chips);
    const links = el('div', 'ed-step-links');
    const addLink = (label, url) => {
      const a = el('a', 'body-5'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.dataset.roll = ''; a.textContent = label;
      a.insertAdjacentHTML('beforeend', ARROW); links.append(a);
    };
    if (project.githubUrl) addLink('GitHub', project.githubUrl);
    if (project.videoUrl && !isVideo(project.videoUrl)) addLink('Live demo', project.videoUrl);
    if (project.linkedinUrl) addLink('LinkedIn post', project.linkedinUrl);
    if (links.childElementCount) step.append(links);
    stepsRoot.append(step);
    steps.push(step);

    const layer = el('div', 'ed-media');
    const media = buildMedia(project);
    layer.append(media);
    mediaRoot.append(layer);
    layers.push({ layer, media });
  });

  let current = -1;
  const setActive = (i) => {
    if (i === current || !layers[i]) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('active', k === i));
    layers.forEach(({ layer, media }, k) => {
      layer.classList.toggle('active', k === i);
      if (k === i) playVideo(media); else stopVideo(media);
    });
    loadVideo(layers[i + 1]?.media);
    counter.textContent = `${pad(i + 1)} / ${pad(layers.length)}`;
    bar.style.transform = `scaleX(${(i + 1) / layers.length})`;
  };
  setActive(0);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setActive(Number(entry.target.dataset.index)); });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach((s) => io.observe(s));

  // Pause videos when the whole section is offscreen
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) layers.forEach(({ media }) => stopVideo(media));
    else playVideo(layers[current]?.media);
  }, { threshold: 0 }).observe($('#feature'));
}

/* ---------- On the clock / Off the clock ---------- */
function renderGrids() {
  const buckets = { team: [], solo: [], more: [] };
  sorted.forEach((p) => buckets[PROJECT_MODE[p.id] || 'more'].push(p));
  Object.entries(buckets).forEach(([key, list]) => {
    const group = $(`[data-group="${key}"]`);
    if (!group) return;
    if (!list.length) { group.hidden = true; return; }
    group.hidden = false;
    const grid = $('.ed-grid', group);
    list.forEach((project) => {
      const tile = el('article', 'ed-tile');
      const mediaWrap = el('div', 'ed-tile-media');
      const media = buildMedia(project);
      mediaWrap.append(media);
      const body = el('div', 'ed-tile-body');
      const title = el('h4', 'title-2');
      const link = el('a', 'ed-tile-link', project.title);
      link.href = './projects.html';
      title.append(link);
      const meta = el('div', 'ed-tile-meta body-6');
      meta.append(el('span', '', project.category), el('span', '', (project.technologies || []).slice(0, 2).join(', ')));
      body.append(title, meta);
      if (project.githubUrl) {
        const gh = el('a', 'ed-tile-gh body-5');
        gh.href = project.githubUrl; gh.target = '_blank'; gh.rel = 'noopener noreferrer'; gh.dataset.roll = ''; gh.textContent = 'GitHub';
        gh.insertAdjacentHTML('beforeend', ARROW);
        body.append(gh);
      }
      tile.append(mediaWrap, body);
      grid.append(tile);

      if (media.tagName === 'VIDEO') {
        new IntersectionObserver((entries, obs) => {
          if (entries[0].isIntersecting) { loadVideo(media); obs.disconnect(); }
        }, { rootMargin: '300px' }).observe(tile);
        const start = () => playVideo(media);
        const stop = () => { stopVideo(media); media.currentTime = 0.1; };
        tile.addEventListener('pointerenter', start);
        tile.addEventListener('pointerleave', stop);
        tile.addEventListener('focusin', start);
        tile.addEventListener('focusout', stop);
      }
    });
  });
}

/* ---------- Kinetic text ---------- */
function splitLines(node) {
  if (node._orig === undefined) node._orig = node.textContent.trim().replace(/\s+/g, ' ');
  const words = node._orig.split(' ');
  node.textContent = '';
  const probes = words.map((w) => {
    const s = document.createElement('span');
    s.style.display = 'inline-block';
    s.textContent = w;
    node.append(s, ' ');
    return s;
  });
  const lines = [];
  let lastTop = null;
  probes.forEach((s) => {
    const top = s.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 2) { lines.push([]); lastTop = top; }
    lines[lines.length - 1].push(s.textContent);
  });
  node.textContent = '';
  lines.forEach((ws, i) => {
    const line = el('span', 'ed-line');
    const inner = el('span', 'ed-line-in', ws.join(' '));
    inner.style.setProperty('--i', i);
    line.append(inner);
    node.append(line);
  });
  node._width = node.clientWidth;
}

function setupSplits() {
  const nodes = $$('[data-split]');
  nodes.forEach(splitLines);
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => nodes.forEach((n) => { if (Math.abs(n.clientWidth - (n._width || 0)) > 1) splitLines(n); }));
  });
  nodes.forEach((n) => ro.observe(n));
}

function setupReveals() {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  $$('[data-split], [data-reveal]').forEach((n) => { if (!n.closest('.ed-hero')) io.observe(n); });
}

function setupWords() {
  const node = $('#tagline');
  const text = node.textContent.trim().replace(/\s+/g, ' ');
  node.setAttribute('aria-label', text);
  node.textContent = '';
  const words = text.split(' ').map((w, i, all) => {
    const s = el('span', 'ed-word', i < all.length - 1 ? `${w} ` : w);
    s.setAttribute('aria-hidden', 'true');
    node.append(s);
    return s;
  });
  return words;
}

function setupRoll() {
  $$('[data-roll]').forEach((node) => {
    if (node.querySelector('.ed-roll')) return;
    const textNode = [...node.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!textNode) return;
    const label = textNode.textContent.trim();
    const roll = el('span', 'ed-roll');
    roll.append(el('span', 'ed-roll-a', label));
    const b = el('span', 'ed-roll-b', label);
    b.setAttribute('aria-hidden', 'true');
    roll.append(b);
    textNode.replaceWith(roll);
  });
}

function setupScroll(words) {
  const title = $('.ed-hero-title');
  const cue = $('.ed-scroll-cue');
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (!reduced) {
      const p = Math.min(1, Math.max(0, window.scrollY / (vh * 0.8)));
      title.style.setProperty('--ed-track', `${(-0.04 + 0.06 * p).toFixed(4)}em`);
      title.style.transform = `translate3d(0, ${(-p * 40).toFixed(1)}px, 0)`;
      if (cue) cue.style.opacity = String(1 - p);
    }
    const trigger = vh * 0.72;
    words.forEach((w) => w.classList.toggle('on', reduced || w.getBoundingClientRect().top < trigger));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function setupSpy() {
  const links = new Map($$('[data-spy]').map((a) => [a.dataset.spy, a]));
  // sections that belong to a dock item (null = no dock item is current)
  const owner = { story: 'story', work: 'work', reel: 'work', archive: 'work', skills: null, contact: 'contact' };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const active = owner[entry.target.id];
      links.forEach((a, id) => { if (id === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  Object.keys(owner).forEach((id) => { const section = document.getElementById(id); if (section) io.observe(section); });
}

/* ---------- Showreel: load the 3D component only when near ---------- */
function setupReel() {
  const root = $('#showcase-root');
  new IntersectionObserver(async (entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    try {
      const { mountShowcase } = await import('../components/PortfolioShowcase.js');
      mountShowcase(root);
    } catch (error) {
      root.append(el('p', 'body-6 ed-muted', 'The showreel could not load. You can still browse every project in the projects catalog.'));
    }
  }, { rootMargin: '400px' }).observe(root);
}

/* ---------- Loader ---------- */
function setupLoader() {
  const loader = $('#loading-screen');
  const started = performance.now();
  const loaded = new Promise((res) => {
    if (document.readyState === 'complete') res(); else window.addEventListener('load', res, { once: true });
  });
  const fonts = document.fonts?.ready || Promise.resolve();
  const cap = new Promise((res) => setTimeout(res, 4000));
  return Promise.race([Promise.all([loaded, fonts]), cap]).then(() => new Promise((res) => {
    const wait = Math.max(0, 1400 - (performance.now() - started));
    setTimeout(() => { loader.classList.add('hidden'); res(); }, wait);
  }));
}

/* ---------- Boot ---------- */
renderFacts();
renderMarquee();
renderSkills();
renderContactLinks();
renderFeatured();
renderGrids();
const words = setupWords();
setupRoll();

const ready = document.fonts?.ready || Promise.resolve();
ready.then(() => {
  setupSplits();
  setupReveals();
  setupScroll(words);
  setupSpy();
  setupReel();
});

setupLoader().then(() => {
  $('.ed-hero-title')?.classList.add('in');
  $$('.ed-hero [data-reveal]').forEach((n, i) => setTimeout(() => n.classList.add('in'), 300 + i * 120));
});

new ContactManager('contact-form', 'contact-feedback');
new FooterManager();
