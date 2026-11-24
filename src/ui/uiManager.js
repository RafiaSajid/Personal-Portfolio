import { portfolioData, skillOrbitGroups } from '../data/portfolioData.js';

export class UIManager {
  constructor(avatarController, audioManager, groundedChat) {
    this.avatar = avatarController;
    this.audio = audioManager;
    this.chat = groundedChat;

    // State
    this.currentNearbyLandmark = null;
    this.activePanel = null; // 'education' | 'skills' | null

    // DOM Elements
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingMsg = document.getElementById('loading-message');
    this.coordDisplay = document.getElementById('hud-coords');
    this.debugScene = document.documentElement.classList.contains('debug-scene');
    this.interactionHint = document.getElementById('interaction-hint');
    this.hintText = document.getElementById('hint-text');

    // Content Panel Elements
    this.panelBackdrop = document.getElementById('panel-backdrop');
    this.contentPanel = document.getElementById('content-panel');
    this.panelTitle = document.getElementById('panel-title');
    this.panelBody = document.getElementById('panel-body');
    this.panelClose = document.getElementById('panel-close');

    // Navigation & Hamburger
    this.navToggle = document.getElementById('nav-toggle');
    this.navMobile = document.getElementById('nav-mobile');
    this.nearbySkillGroup = null;
    window.addEventListener('portfolio:skill-approach', (event) => {
      this.nearbySkillGroup = Number.isInteger(event.detail?.index) ? event.detail.index : null;
      if (this.activePanel !== 'skills' || this.nearbySkillGroup === null) return;
      this.panelBody?.querySelector(`[data-skill-group="${this.nearbySkillGroup}"]`)?.click();
    });
    window.addEventListener('portfolio:skill-focus', (event) => {
      const { x, y, z } = event.detail || {};
      if ([x, y, z].every(Number.isFinite)) this.avatar.focusCameraOn?.(x, y, z);
    });

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupPanelEvents();
    this.setupInteractionHint();
    this.setupHomeIntro();
    this.setupEscapeListener();
    this.checkInitialHash();
  }

  setLoading(isLoading, message = 'Loading 3D Star Path...') {
    if (!this.loadingScreen) return;
    if (isLoading) {
      this.loadingScreen.classList.remove('hidden');
      if (this.loadingMsg) this.loadingMsg.textContent = message;
    } else {
      this.loadingScreen.classList.add('hidden');
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-nav]');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-nav');
        this.setActiveNavigation(target);
        this.navigateToSection(target);
        if (this.navMobile) this.navMobile.classList.remove('open');
        this.navToggle?.setAttribute('aria-expanded', 'false');
      });
    });

    if (this.navToggle && this.navMobile) {
      this.navToggle.addEventListener('click', () => {
        const isOpen = this.navMobile.classList.toggle('open');
        this.navToggle.setAttribute('aria-expanded', isOpen);
      });
    }
  }

  setActiveNavigation(sectionId) {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.closest('#nav-mobile')) return;
      if (link.getAttribute('data-nav') === sectionId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('#nav-mobile [data-nav]').forEach((link) => {
      if (link.getAttribute('data-nav') === sectionId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  checkInitialHash() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'education') {
      setTimeout(() => this.openPanel('education'), 400);
    } else if (hash === 'skills') {
      setTimeout(() => this.openPanel('skills'), 400);
    } else if (hash === 'chat') {
      setTimeout(() => this.chat?.open(), 400);
    }
  }

  navigateToSection(sectionId, skillGroupIndex = null) {
    if (sectionId === 'home') {
      this.closePanel();
      this.chat?.close();
      this.avatar.clearCameraFocus?.();
      this.avatar.warpTo(0, 0, 4, Math.PI);
      return;
    }

    if (sectionId === 'chat') {
      this.avatar.clearCameraFocus?.();
      this.closePanel();
      this.chat?.open();
      return;
    }

    const lm = portfolioData.landmarks.find(l => l.id === sectionId);
    if (!lm) return;
    if (sectionId !== 'skills') this.avatar.clearCameraFocus?.();

    this.audio?.playUISound('warp');

    const targetX = lm.position.x > 0 ? lm.position.x - 2.5 : lm.position.x + 2.5;
    const targetZ = lm.targetZ || lm.position.z + 4.0;

    this.avatar.transitionTo(targetX, targetZ, 1.4, () => {
      this.executeSectionAction(sectionId, skillGroupIndex);
    });
  }

  executeSectionAction(landmarkId, skillGroupIndex = null) {
    if (landmarkId === 'about') {
      window.location.href = './about.html';
    } else if (landmarkId === 'projects') {
      window.location.href = './projects.html';
    } else if (landmarkId === 'education') {
      this.openPanel('education');
    } else if (landmarkId === 'skills') {
      const skillLandmark = portfolioData.landmarks.find((landmark) => landmark.id === 'skills');
      if (skillLandmark) {
        this.avatar.focusCameraOn?.(skillLandmark.position.x, skillLandmark.position.y, skillLandmark.position.z);
      }
      this.openPanel('skills', skillGroupIndex ?? 0);
    }
  }

  onProximityChanged(landmarkData) {
    this.currentNearbyLandmark = landmarkData;

    if (landmarkData && this.interactionHint && this.hintText) {
      this.hintText.textContent = `[E] ${landmarkData.actionText || 'Visit Star'}`;
      this.interactionHint.classList.add('visible');
      this.audio?.playUISound('chime');
    } else if (this.interactionHint) {
      this.interactionHint.classList.remove('visible');
    }
  }

  handleInteract() {
    if (this.currentNearbyLandmark) {
      this.audio?.playUISound('warp');
      this.executeSectionAction(this.currentNearbyLandmark.id);
    }
  }

  setupInteractionHint() {
    if (this.interactionHint) {
      this.interactionHint.addEventListener('click', () => {
        this.handleInteract();
      });
    }
  }

  setupPanelEvents() {
    if (this.panelClose) {
      this.panelClose.addEventListener('click', () => this.closePanel());
    }

    if (this.panelBackdrop) {
      this.panelBackdrop.addEventListener('click', () => this.closePanel());
    }
  }

  setupEscapeListener() {
    window.addEventListener('ui:escape', () => {
      if (this.activePanel) {
        this.closePanel();
      } else if (this.chat?.isOpen) {
        this.chat.close();
      }
    });
  }

  setupHomeIntro() {
    const exploreBtn = document.getElementById('explore-btn');
    const homeIntro = document.getElementById('home-intro');
    if (exploreBtn && homeIntro) {
      exploreBtn.addEventListener('click', () => {
        homeIntro.classList.add('hidden');
        this.audio?.playUISound('chime');
      });
    }
  }

  openPanel(panelId, selectedSkillGroup = null) {
    this.activePanel = panelId;
    this.audio?.playUISound('open');
    this.contentPanel?.classList.toggle('skills-open', panelId === 'skills');
    this.panelBackdrop?.classList.toggle('skills-open', panelId === 'skills');
    if (this.contentPanel) this.contentPanel.dataset.panelType = panelId;

    if (panelId === 'education') {
      this.panelTitle.textContent = 'EDUCATION & CERTIFICATIONS';
      this.panelBody.innerHTML = this.renderEducationHTML();
    } else if (panelId === 'skills') {
      this.panelTitle.textContent = 'SKILLS // TECHNICAL MATRIX';
      this.panelBody.innerHTML = this.renderSkillsHTML();
      this.panelBody.querySelectorAll('[data-skill-group]').forEach((button) => {
        button.addEventListener('click', () => {
          const selectedIndex = button.dataset.skillGroup;
          this.panelBody.querySelectorAll('[data-skill-group]').forEach((item) => {
            const selected = item === button;
            item.classList.toggle('is-selected', selected);
            item.setAttribute('aria-pressed', String(selected));
          });
          this.panelBody.querySelectorAll('[data-skill-panel]').forEach((panel) => {
            const selected = panel.dataset.skillPanel === selectedIndex;
            panel.hidden = !selected;
            panel.classList.toggle('is-selected', selected);
          });
          window.dispatchEvent(new CustomEvent('portfolio:skill-select', { detail: { index: Number(selectedIndex) } }));
        });
      });
      const activeGroup = selectedSkillGroup ?? this.nearbySkillGroup ?? 0;
      this.panelBody.querySelector(`[data-skill-group="${activeGroup}"]`)?.click();
    }

    this.panelBackdrop?.classList.add('open');
    this.contentPanel?.classList.add('open');
    this.panelClose?.focus();
  }

  closePanel() {
    this.activePanel = null;
    this.audio?.playUISound('close');
    this.panelBackdrop?.classList.remove('open');
    this.panelBackdrop?.classList.remove('skills-open');
    this.contentPanel?.classList.remove('open');
    this.contentPanel?.classList.remove('skills-open');
  }

  renderEducationHTML() {
    const edu = portfolioData.education;
    const certs = portfolioData.certifications || [];

    return `
      <div class="edu-card">
        <h3>${edu.institution}</h3>
        <p><strong>${edu.degree}</strong></p>
        <p style="color:var(--emerald); margin-top:0.25rem;">${edu.specialization}</p>
        <div class="edu-meta">
          <span class="edu-badge">${edu.location}</span>
          <span class="edu-badge">${edu.status}</span>
        </div>
        <p style="margin-top:0.6rem; font-size:0.85rem; color:var(--text-muted);">${edu.summary}</p>
      </div>

      <div style="margin-top: 1.5rem; margin-bottom: 0.75rem;">
        <h4 style="font-size:0.9rem; color:var(--cyan); text-transform:uppercase; letter-spacing:0.06em;">Professional Certifications</h4>
      </div>

      ${certs.map(c => `
        <div class="edu-card" style="margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="font-size:0.95rem; color:var(--text-strong);">${c.title}</h4>
            <span class="edu-badge">Certified by ${c.issuer}</span>
          </div>
          <p style="margin-top:0.4rem; font-size:0.84rem; color:var(--text-muted);">${c.topics}</p>
        </div>
      `).join('')}
    `;
  }

  renderSkillsHTML() {
    const allSkills = portfolioData.skills.flatMap(group => group.items);
    const skillByName = new Map(allSkills.map(skill => [skill.name, skill]));
    const groups = skillOrbitGroups.map(group => ({
      ...group,
      skills: group.names.map(name => skillByName.get(name)).filter(Boolean)
    }));

    const groupButtons = groups.map((group, index) => `
      <button class="skill-selector-button${index === 0 ? ' is-selected' : ''}" type="button"
        data-skill-group="${index}" aria-pressed="${index === 0}">
        <span class="skill-selector-marker" aria-hidden="true"></span><span>${group.label}</span>
      </button>
    `).join('');

    const groupPanels = groups.map((group, index) => `
      <section class="skill-group-panel${index === 0 ? ' is-selected' : ''}" data-skill-panel="${index}"${index === 0 ? '' : ' hidden'}>
        <h3>${group.label}</h3>
        <ul>${group.skills.map(skill => `<li><strong>${skill.name}</strong><span>${skill.desc}</span></li>`).join('')}</ul>
      </section>
    `).join('');

    return `
      <div class="skills-experience">
        <p class="skills-intro">Select a planet in the scene or choose a skill group here.</p>
        <div class="skills-layout">
          <nav class="skills-selector" aria-label="Skill groups">
            ${groupButtons}
          </nav>
          <div class="skills-detail" aria-live="polite">${groupPanels}</div>
        </div>
      </div>
    `;
  }

  updateHUD(avatarPos, orbitYaw) {
    if (this.debugScene && this.coordDisplay) {
      const z = avatarPos.z.toFixed(1);
      const x = avatarPos.x.toFixed(1);
      this.coordDisplay.textContent = `STAR PATH // X: ${x} | Z: ${z}`;
    }
  }

  showWebGLFallback() {
    const fallback = document.getElementById('webgl-fallback');
    if (fallback) {
      fallback.classList.add('visible');
    }
  }
}
