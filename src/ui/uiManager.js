import { portfolioData, skillOrbitGroups } from '../data/portfolioData.js';

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeMediaURL(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
}

export class UIManager {
  constructor(avatarController, audioManager, groundedChat, worldJourneys) {
    this.avatar = avatarController;
    this.audio = audioManager;
    this.chat = groundedChat;
    this.worldJourneys = worldJourneys;

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
    this.nearbyJourneyPrompt = null;
    window.addEventListener('portfolio:skill-approach', (event) => {
      this.nearbySkillGroup = Number.isInteger(event.detail?.index) ? event.detail.index : null;
      if (this.activePanel !== 'skills' || this.nearbySkillGroup === null) return;
      this.panelBody?.querySelector(`[data-skill-group="${this.nearbySkillGroup}"]`)?.click();
    });
    window.addEventListener('portfolio:skill-focus', (event) => {
      const { x, y, z } = event.detail || {};
      if ([x, y, z].every(Number.isFinite)) this.avatar.focusCameraOn?.(x, y, z);
    });
    window.addEventListener('portfolio:destination-change', (event) => {
      const destination = event.detail?.destination;
      if (destination === 'projects') this.openProjectsPanel();
      else if (destination === 'skills') this.openPanel('skills');
      else if (destination === 'about') this.openAboutArchivePanel();
      else this.closePanel();
    });
    window.addEventListener('portfolio:journey-proximity', (event) => {
      this.nearbyJourneyPrompt = event.detail || null;
      if (!this.interactionHint || !this.hintText) return;
      const prompt = this.nearbyJourneyPrompt;
      if (!prompt?.key) {
        if (!this.currentNearbyLandmark) this.interactionHint.classList.remove('visible');
        return;
      }
      if (prompt.portal) this.hintText.textContent = `[E] ENTER ${prompt.portal.toUpperCase()} PORTAL`;
      else if (prompt.project) this.hintText.textContent = `[E] INSPECT ${prompt.project.title.toUpperCase()}`;
      else if (prompt.exhibit) this.hintText.textContent = `[E] EXAMINE ${prompt.exhibit.title.toUpperCase()}`;
      else if (prompt.exit) this.hintText.textContent = '[E] ENTER HOME PORTAL';
      this.interactionHint.classList.add('visible');
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

  setLoading(isLoading, message = 'Loading 3D space...') {
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
      setTimeout(() => this.navigateToSection('skills'), 400);
    } else if (hash === 'projects') {
      setTimeout(() => this.navigateToSection('projects'), 400);
    } else if (hash === 'about') {
      setTimeout(() => this.navigateToSection('about'), 400);
    } else if (hash === 'chat') {
      setTimeout(() => this.chat?.open(), 400);
    }
  }

  navigateToSection(sectionId, skillGroupIndex = null) {
    if (sectionId === 'home') {
      this.closePanel();
      this.chat?.close();
      if (this.worldJourneys?.destination !== 'home') {
        this.worldJourneys?.returnHome();
        return;
      }
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

    if (sectionId === 'projects' || sectionId === 'skills' || sectionId === 'about') {
      this.chat?.close();
      this.closePanel();
      this.worldJourneys?.enter(sectionId);
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
      this.worldJourneys?.enter('about');
    } else if (landmarkId === 'projects') {
      this.worldJourneys?.enter('projects');
    } else if (landmarkId === 'education') {
      this.openPanel('education');
    } else if (landmarkId === 'skills') {
      this.worldJourneys?.enter('skills');
      if (Number.isInteger(skillGroupIndex)) this.nearbySkillGroup = skillGroupIndex;
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
    if (this.worldJourneys?.currentNearbyExit) {
      this.worldJourneys.returnHome({ nearby: true });
      return;
    }
    if (this.worldJourneys?.currentNearbyExhibit) {
      this.openExhibitDetails(this.worldJourneys.currentNearbyExhibit.exhibit.id);
      return;
    }
    if (this.worldJourneys?.currentNearbyProject) {
      this.openProjectDetails(this.worldJourneys.currentNearbyProject.project.id);
      return;
    }
    if (this.worldJourneys?.currentNearbyPortal) {
      this.worldJourneys.enter(this.worldJourneys.currentNearbyPortal.id);
      return;
    }
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
    this.contentPanel?.setAttribute('aria-modal', String(panelId === 'education'));
    if (this.contentPanel) this.contentPanel.dataset.panelType = panelId;

    if (panelId === 'education') {
      this.panelTitle.textContent = 'EDUCATION & CERTIFICATIONS';
      this.panelBody.innerHTML = this.renderEducationHTML();
    } else if (panelId === 'skills') {
      this.panelTitle.textContent = 'SKILLS ORBIT // EXPLORE';
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
    this.panelBackdrop?.classList.remove('projects-world-open');
    this.panelBackdrop?.classList.remove('about-world-open');
    this.contentPanel?.classList.remove('open');
    this.contentPanel?.classList.remove('skills-open');
    this.contentPanel?.classList.remove('projects-world-open');
    this.contentPanel?.classList.remove('about-world-open');
    this.contentPanel?.setAttribute('aria-modal', 'false');
    this.avatar.clearCameraFocus?.();
  }

  openAboutArchivePanel(selectedExhibitId = null) {
    this.activePanel = 'about';
    this.audio?.playUISound('open');
    this.contentPanel?.classList.remove('skills-open');
    this.contentPanel?.classList.remove('projects-world-open');
    this.panelBackdrop?.classList.remove('skills-open');
    this.panelBackdrop?.classList.remove('projects-world-open');
    this.contentPanel?.classList.add('about-world-open');
    this.panelBackdrop?.classList.add('about-world-open');
    this.contentPanel?.setAttribute('aria-modal', 'false');
    if (this.contentPanel) this.contentPanel.dataset.panelType = 'about-station';

    this.panelTitle.textContent = 'PERSONAL ARCHIVE // ORBITAL RESEARCH STATION';

    const exhibitDefs = [
      { id: 'study', title: 'Academic studies', category: 'NED University' },
      { id: 'vr', title: 'VR game work', category: 'VR Games Hub' },
      { id: 'animation', title: '3D and motion tools', category: 'Blender & Animation' }
    ];

    this.panelBody.innerHTML = `
      <div class="world-project-browser about-station-browser">
        <p class="skills-intro">Walk the orbital research deck. Approach an exhibit object and press [E] or select below to reveal its archive story view.</p>
        <nav class="world-project-list" aria-label="Archive exhibits">
          ${exhibitDefs.map((ex) => `
            <button type="button" class="world-project-choice" data-station-exhibit="${escapeHTML(ex.id)}" aria-pressed="false">
              <span>${escapeHTML(ex.title)}</span>
              <small>${escapeHTML(ex.category)}</small>
            </button>
          `).join('')}
        </nav>
        <div class="world-project-detail about-station-story-view" data-station-story-view aria-live="polite"></div>
        <a class="world-catalog-link" href="./about.html">Open full accessible About page</a>
      </div>
    `;

    this.panelBody.querySelectorAll('[data-station-exhibit]').forEach((button) => {
      button.addEventListener('click', () => this.openExhibitDetails(button.dataset.stationExhibit));
    });

    this.panelBackdrop?.classList.add('open');
    this.contentPanel?.classList.add('open');
    const initialExhibit = selectedExhibitId || 'study';
    this.openExhibitDetails(initialExhibit);
    this.panelClose?.focus();
  }

  openExhibitDetails(exhibitId) {
    const vrProject = portfolioData.projects.find((p) => p.id === 'vr-games-hub');
    const blenderSkill = portfolioData.skills.flatMap((g) => g.items).find((s) => s.name === 'Blender');
    const toolsSoftware = portfolioData.skills.find((g) => g.category === 'Tools & Software')?.items
      .filter((s) => s.name !== 'Blender')
      .map((s) => `${s.name}: ${s.desc}`)
      .join(' ') || '';

    const stories = {
      study: {
        id: 'study',
        title: 'Academic Studies & Degree Track',
        kicker: 'NED UNIVERSITY • GAMING & ANIMATION',
        body: `${portfolioData.education.degree} at ${portfolioData.education.institution}, specializing in ${portfolioData.education.specialization}.`,
        detail: `${portfolioData.education.location}. Status: ${portfolioData.education.status}. ${portfolioData.education.summary}`,
        facts: [
          `Institution: ${portfolioData.education.institution}`,
          `Degree: ${portfolioData.education.degree}`,
          `Specialization: ${portfolioData.education.specialization}`,
          `Location: ${portfolioData.education.location}`
        ]
      },
      vr: {
        id: 'vr',
        title: vrProject?.title || 'VR Games Hub Work',
        kicker: 'VIRTUAL REALITY • UNITY',
        body: vrProject?.details || 'Virtual Reality development covering 3D city environments, interactive shooting systems, and haptics.',
        detail: vrProject?.contribution || 'Built target-shooting mechanics, haptic gun feedback, scoring systems, and teleportation logic.',
        facts: [
          'Engine: Unity VR',
          'Key Mechanics: Haptic feedback, scoring system, target shooting, teleportation',
          'Environment: 3D city interactive mini-games hub'
        ]
      },
      animation: {
        id: 'animation',
        title: '3D Character & Motion Tools',
        kicker: 'BLENDER • CHARACTER RIGGING & ANIMATION',
        body: blenderSkill?.desc || '3D animated character creation, modeling, rigging, and asset preparation for game engines.',
        detail: toolsSoftware || 'Integrated pipeline across Blender and motion graphic workflows.',
        facts: [
          'Primary 3D Tool: Blender',
          'Scope: 3D character modeling, rigging, walk cycle animation, engine preparation',
          'Engine Target: Unity & Unreal Engine runtime compatibility'
        ]
      }
    };

    const story = stories[exhibitId] || stories.study;

    if (this.activePanel !== 'about' || !this.panelBody?.querySelector('[data-station-story-view]')) {
      this.openAboutArchivePanel(story.id);
      return;
    }

    this.panelBody.querySelectorAll('[data-station-exhibit]').forEach((button) => {
      const selected = button.dataset.stationExhibit === story.id;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const storyView = this.panelBody.querySelector('[data-station-story-view]');
    if (storyView) {
      storyView.innerHTML = `
        <p class="world-project-category">${escapeHTML(story.kicker)}</p>
        <h3>${escapeHTML(story.title)}</h3>
        <p style="font-size:0.95rem; line-height:1.6; color:var(--text-strong); margin-bottom:0.75rem;">${escapeHTML(story.body)}</p>
        <p style="font-size:0.88rem; line-height:1.6; color:var(--text-muted); margin-bottom:1rem;">${escapeHTML(story.detail)}</p>
        <section style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.85rem; border-radius:6px; margin-top:0.5rem;">
          <h4 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--cyan); margin-bottom:0.5rem;">ARCHIVE FACTS</h4>
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.35rem;">
            ${story.facts.map((f) => `<li style="font-size:0.82rem; color:var(--text-dim); display:flex; gap:0.5rem;"><span style="color:var(--emerald);">&#9656;</span> <span>${escapeHTML(f)}</span></li>`).join('')}
          </ul>
        </section>
      `;
    }

    // Focus camera smoothly on the corresponding exhibit in the 3D scene if in About destination
    if (this.worldJourneys?.destination === 'about') {
      const station = this.worldJourneys.destinations.about;
      const display = station?.exhibitDisplays?.find((d) => d.exhibit.id === story.id);
      if (display) {
        const p = display.mesh.getWorldPosition(new THREE.Vector3());
        this.avatar.focusCameraOn?.(p.x, p.y + 1.2, p.z);
      }
    }
  }

  openProjectsPanel(selectedProjectId = null) {
    this.activePanel = 'projects';
    this.audio?.playUISound('open');
    this.contentPanel?.classList.remove('skills-open');
    this.panelBackdrop?.classList.remove('skills-open');
    this.contentPanel?.classList.add('projects-world-open');
    this.contentPanel?.setAttribute('aria-modal', 'false');
    if (this.contentPanel) this.contentPanel.dataset.panelType = 'projects-world';
    this.panelTitle.textContent = 'PROJECT GALLERY';
    const projects = [...portfolioData.projects].sort((a, b) => (a.order || 99) - (b.order || 99));
    this.panelBody.innerHTML = `
      <div class="world-project-browser">
        <p class="skills-intro">Walk among the project displays. Select a title here or approach a display and press E to inspect it.</p>
        <nav class="world-project-list" aria-label="Project exhibits">
          ${projects.map((project) => `<button type="button" class="world-project-choice" data-world-project="${escapeHTML(project.id)}" aria-pressed="false"><span>${escapeHTML(project.title)}</span><small>${escapeHTML(project.category)}</small></button>`).join('')}
        </nav>
        <div class="world-project-detail" data-world-project-detail aria-live="polite"></div>
        <a class="world-catalog-link" href="./projects.html">Open the full projects catalogue</a>
      </div>
    `;
    this.panelBody.querySelectorAll('[data-world-project]').forEach((button) => {
      button.addEventListener('click', () => this.openProjectDetails(button.dataset.worldProject));
    });
    this.panelBackdrop?.classList.add('open', 'projects-world-open');
    this.contentPanel?.classList.add('open');
    const initialProject = selectedProjectId || projects[0]?.id;
    if (initialProject) this.openProjectDetails(initialProject);
    this.panelClose?.focus();
  }

  openProjectDetails(projectId) {
    const project = portfolioData.projects.find((item) => item.id === projectId);
    if (!project) return;
    if (this.activePanel !== 'projects' || !this.panelBody?.querySelector('[data-world-project-detail]')) {
      this.openProjectsPanel(project.id);
      return;
    }
    this.panelBody.querySelectorAll('[data-world-project]').forEach((button) => {
      const selected = button.dataset.worldProject === project.id;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const mediaURL = safeMediaURL(project.videoUrl);
    const imageURL = safeMediaURL(project.thumbnail);
    let video = '';
    if (mediaURL) {
      const media = new URL(mediaURL);
      const youtubeHost = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(media.hostname);
      const youtubeId = media.hostname.includes('youtu.be')
        ? media.pathname.split('/').filter(Boolean)[0]
        : media.searchParams.get('v') || media.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      if (youtubeHost && youtubeId) {
        video = `<iframe class="world-project-video" loading="lazy" src="https://www.youtube-nocookie.com/embed/${escapeHTML(youtubeId)}" title="${escapeHTML(project.title)} video" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      } else if (/\.(mp4|webm|ogg|m4v)$/i.test(media.pathname)) {
        video = `<video class="world-project-video" controls preload="metadata"><source src="${escapeHTML(mediaURL)}">Your browser does not support this video.</video>`;
      } else {
        video = `<a class="world-project-video-link" href="${escapeHTML(mediaURL)}" target="_blank" rel="noopener noreferrer">Open supplied project video</a>`;
      }
    }
    const mediaMarkup = video
      || (imageURL ? `<img class="world-project-image" src="${escapeHTML(imageURL)}" alt="${escapeHTML(project.title)} project preview">` : '');
    const projectLinks = [
      ['GitHub', project.githubUrl],
      ['LinkedIn', project.linkedinUrl]
    ].map(([label, value]) => {
      const url = safeMediaURL(value);
      return url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
    }).filter(Boolean);
    const detail = this.panelBody.querySelector('[data-world-project-detail]');
    detail.innerHTML = `
      ${mediaMarkup}
      <p class="world-project-category">${escapeHTML(project.category)}</p>
      <h3>${escapeHTML(project.title)}</h3>
      <p>${escapeHTML(project.summary)}</p>
      <p>${escapeHTML(project.details)}</p>
      ${project.contribution ? `<section><h4>Contribution</h4><p>${escapeHTML(project.contribution)}</p></section>` : ''}
      <ul class="world-project-technologies">${project.technologies.map((technology) => `<li>${escapeHTML(technology)}</li>`).join('')}</ul>
      ${projectLinks.length ? `<nav class="world-project-links" aria-label="${escapeHTML(project.title)} links">${projectLinks.join('')}</nav>` : ''}
      ${!mediaURL && !imageURL && !projectLinks.length ? '<p class="world-project-no-media">No project media or external links are currently supplied.</p>' : ''}
    `;
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
        <p class="skills-intro">Explore the orbiting planets, or choose a category here. Walk close to a planet to inspect its skills.</p>
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
      this.coordDisplay.textContent = `SPACE // X: ${x} | Z: ${z}`;
    }
  }

  showWebGLFallback() {
    const fallback = document.getElementById('webgl-fallback');
    if (fallback) {
      fallback.classList.add('visible');
    }
  }
}
