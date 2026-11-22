import { portfolioData } from '../data/portfolioData.js';

export class UIManager {
  constructor(avatarController, audioManager, groundedChat) {
    this.avatar = avatarController;
    this.audio = audioManager;
    this.chat = groundedChat;

    // Active state
    this.currentModalId = null;
    this.currentNearbyLandmark = null;

    // DOM Elements
    this.hudElement = document.getElementById('hud');
    this.coordDisplay = document.getElementById('hud-coords');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionText = document.getElementById('interaction-text');
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalSubtitle = document.getElementById('modal-subtitle');
    this.modalBody = document.getElementById('modal-body');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    this.init();
  }

  init() {
    this.setupQuickNav();
    this.setupModals();
    this.setupInteractionPrompt();
    this.setupControlsHelp();
  }

  setupQuickNav() {
    const navButtons = document.querySelectorAll('[data-warp-target]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-warp-target');
        this.warpToTarget(targetId);
      });
    });
  }

  warpToTarget(targetId) {
    if (targetId === 'chat') {
      this.chat?.open();
      return;
    }

    const landmark = portfolioData.landmarks.find((l) => l.id === targetId);
    if (!landmark) return;

    this.audio?.playWarpSound();

    // Warp player to the landmark coordinates (offset slightly so they stand in front)
    const offsetX = targetId === 'about' ? 6 : targetId === 'skills' ? -6 : 0;
    const offsetZ = targetId === 'projects' ? 8 : targetId === 'contact' ? -8 : 0;

    this.avatar.warpTo(
      landmark.position.x + offsetX,
      landmark.position.y,
      landmark.position.z + offsetZ,
      Math.atan2(-offsetX, -offsetZ)
    );

    // If landmark has an action, open its modal automatically for quick convenience
    if (landmark.id !== 'spawn') {
      setTimeout(() => {
        this.openSectionModal(landmark.id);
      }, 350);
    }
  }

  setupModals() {
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModalId) {
        this.closeModal();
      }
    });
  }

  setupInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.addEventListener('click', () => {
        if (this.currentNearbyLandmark) {
          this.openSectionModal(this.currentNearbyLandmark.id);
        }
      });
    }
  }

  setupControlsHelp() {
    const helpBtn = document.getElementById('help-toggle-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.openControlsHelpModal();
      });
    }
  }

  onProximityChanged(landmarkData) {
    this.currentNearbyLandmark = landmarkData;

    if (landmarkData && this.interactionPrompt && this.interactionText) {
      this.interactionText.textContent = `[E] ${landmarkData.actionText || 'Inspect Station'}`;
      this.interactionPrompt.classList.add('visible');
      this.audio?.playChime(640, 'triangle', 0.1);
    } else if (this.interactionPrompt) {
      this.interactionPrompt.classList.remove('visible');
    }
  }

  handleInteractAction() {
    if (this.currentNearbyLandmark) {
      this.openSectionModal(this.currentNearbyLandmark.id);
    }
  }

  updateHUD(avatarPos, orbitYaw) {
    if (this.coordDisplay) {
      const x = avatarPos.x.toFixed(1);
      const z = avatarPos.z.toFixed(1);
      const headingDeg = Math.round(((-orbitYaw * 180) / Math.PI + 360) % 360);
      this.coordDisplay.innerHTML = `<span>POS:</span> X ${x} | Z ${z} <span style="margin-left:8px;">HDG:</span> ${headingDeg}°`;
    }
  }

  openSectionModal(sectionId) {
    this.currentModalId = sectionId;
    this.audio?.playChime(520, 'sine', 0.15);

    if (!this.modalOverlay || !this.modalBody) return;

    if (sectionId === 'about') {
      this.renderAboutModal();
    } else if (sectionId === 'projects') {
      this.renderProjectsModal();
    } else if (sectionId === 'skills') {
      this.renderSkillsModal();
    } else if (sectionId === 'contact') {
      this.renderContactModal();
    }

    this.modalOverlay.classList.add('active');
  }

  closeModal() {
    this.currentModalId = null;
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
    }
  }

  renderAboutModal() {
    const p = portfolioData.profile;
    this.modalTitle.textContent = "COMMAND HUB // MISSION BRIEFING";
    this.modalSubtitle.textContent = `${p.name} • ${p.role}`;

    this.modalBody.innerHTML = `
      <div class="modal-section-grid">
        <div class="bio-main-card">
          <div class="bio-badge-row">
            <span class="cyber-badge">${p.specialization}</span>
            <span class="cyber-badge secondary">${p.education.degree}</span>
          </div>
          <h3 class="bio-tagline">"${p.tagline}"</h3>
          <div class="bio-paragraphs">
            ${p.bio.map(para => `<p>${para}</p>`).join('')}
          </div>
          
          <div class="quick-stats-grid">
            <div class="stat-box">
              <span class="stat-label">Core Focus</span>
              <span class="stat-value">Game Dev & 3D Math</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Specialization</span>
              <span class="stat-value">Gaming & Animation</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Platform Target</span>
              <span class="stat-value">PC / Console / Web3D</span>
            </div>
          </div>
        </div>

        <div class="sidebar-links-card">
          <h4>EXPLORATION DIRECTIVES</h4>
          <p>Navigate the orbital sector to inspect active prototypes, technical competencies, and communication arrays.</p>
          <div class="action-btn-stack">
            <button class="action-btn primary" id="about-to-projects-btn">View Projects in Hangar</button>
            <button class="action-btn" id="about-to-skills-btn">View Skills in Cyber Lab</button>
            <button class="action-btn" id="about-to-contact-btn">Transmit Message</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('about-to-projects-btn')?.addEventListener('click', () => {
      this.closeModal();
      this.warpToTarget('projects');
    });
    document.getElementById('about-to-skills-btn')?.addEventListener('click', () => {
      this.closeModal();
      this.warpToTarget('skills');
    });
    document.getElementById('about-to-contact-btn')?.addEventListener('click', () => {
      this.closeModal();
      this.warpToTarget('contact');
    });
  }

  renderProjectsModal() {
    this.modalTitle.textContent = "THE ORBITAL HANGAR // PROJECT REGISTRY";
    this.modalSubtitle.textContent = "Game Prototypes, Mechanics Systems, and 3D Interactive Environments";

    const projects = portfolioData.projects;

    this.modalBody.innerHTML = `
      <div class="projects-container">
        <div class="projects-filter-bar">
          <button class="filter-tab active" data-filter="all">All Modules (${projects.length})</button>
          <button class="filter-tab" data-filter="Game Development">Game Dev</button>
          <button class="filter-tab" data-filter="Web3D / Three.js">Web3D</button>
          <button class="filter-tab" data-filter="Animation & Modeling">Animation</button>
        </div>

        <div class="projects-grid" id="projects-grid-list">
          ${this.generateProjectsHTML(projects)}
        </div>
      </div>
    `;

    // Filter tab handler
    const filterTabs = this.modalBody.querySelectorAll('.filter-tab');
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filterVal = tab.getAttribute('data-filter');
        const filtered = filterVal === 'all'
          ? projects
          : projects.filter(p => p.category === filterVal);
        const grid = document.getElementById('projects-grid-list');
        if (grid) grid.innerHTML = this.generateProjectsHTML(filtered);
      });
    });
  }

  generateProjectsHTML(projects) {
    return projects.map((p) => `
      <div class="project-card">
        <div class="project-card-header">
          <span class="project-tag-pill">${p.tag}</span>
          <span class="project-cat-label">${p.category}</span>
        </div>
        <h3 class="project-card-title">${p.title}</h3>
        <p class="project-card-summary">${p.summary}</p>
        <p class="project-card-details">${p.details}</p>

        <div class="project-tech-tags">
          ${p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>

        <div class="project-stats-row">
          ${Object.entries(p.stats || {}).map(([key, val]) => `
            <div class="mini-stat">
              <span class="mini-stat-key">${key.toUpperCase()}:</span>
              <span class="mini-stat-val">${val}</span>
            </div>
          `).join('')}
        </div>

        <div class="project-actions-row">
          ${p.links.demo && p.links.demo !== '#' ? `
            <a href="${p.links.demo}" target="_blank" rel="noopener" class="card-btn primary">Live Demo</a>
          ` : `
            <span class="card-btn disabled">Demo In-Orbit</span>
          `}
          ${p.links.code && p.links.code !== '#' ? `
            <a href="${p.links.code}" target="_blank" rel="noopener" class="card-btn">Source Code</a>
          ` : `
            <span class="card-btn disabled">Repo Ready</span>
          `}
        </div>
      </div>
    `).join('');
  }

  renderSkillsModal() {
    this.modalTitle.textContent = "CYBER LABORATORY // CAPABILITY MATRIX";
    this.modalSubtitle.textContent = "Programming Languages, Game Engines, Graphics Math, and Animation Pipelines";

    const skills = portfolioData.skills;

    this.modalBody.innerHTML = `
      <div class="skills-categories-grid">
        ${skills.map(cat => `
          <div class="skill-group-card">
            <h3 class="skill-group-title">
              <span class="skill-category-icon">✦</span> ${cat.category}
            </h3>
            <div class="skill-items-list">
              ${cat.items.map(item => `
                <div class="skill-item">
                  <div class="skill-item-header">
                    <span class="skill-name">${item.name}</span>
                    <span class="skill-level-badge">${item.level}</span>
                  </div>
                  <p class="skill-desc">${item.desc}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderContactModal() {
    const contact = portfolioData.profile.contact;
    this.modalTitle.textContent = "DEEP SPACE RELAY // TRANSMISSION CONDUIT";
    this.modalSubtitle.textContent = "Establish Contact, Direct Inquiries, and Network Links";

    this.modalBody.innerHTML = `
      <div class="contact-grid">
        <div class="contact-info-panel">
          <h3>ORBITAL FREQUENCIES</h3>
          <p>Feel free to transmit inquiries regarding game development collaborations, internships, or creative technical opportunities.</p>
          
          <div class="contact-direct-links">
            <div class="contact-field">
              <span class="field-label">PRIMARY EMAIL:</span>
              <div class="field-val-row">
                <span class="field-val" id="email-text">${contact.email}</span>
                <button class="copy-btn" id="copy-email-btn" title="Copy Email">Copy</button>
              </div>
            </div>

            <div class="contact-field">
              <span class="field-label">STATUS & LOCATION:</span>
              <span class="field-val">${contact.location}</span>
            </div>

            <div class="social-links-row">
              <a href="${contact.github}" target="_blank" rel="noopener" class="social-chip">
                <span>GitHub Profile</span>
              </a>
              <a href="${contact.linkedin}" target="_blank" rel="noopener" class="social-chip">
                <span>LinkedIn</span>
              </a>
              <a href="${contact.itch}" target="_blank" rel="noopener" class="social-chip">
                <span>Itch.io</span>
              </a>
            </div>
          </div>
        </div>

        <div class="contact-form-panel">
          <h3>TRANSMIT DISPATCH</h3>
          <form id="contact-form" class="cyber-form">
            <div class="form-group">
              <label for="contact-name">CALLSIGN / NAME</label>
              <input type="text" id="contact-name" required placeholder="Commander Jane Doe" />
            </div>
            <div class="form-group">
              <label for="contact-email">RETURN FREQUENCY / EMAIL</label>
              <input type="email" id="contact-email" required placeholder="jane@starfleet.org" />
            </div>
            <div class="form-group">
              <label for="contact-msg">TRANSMISSION CONTENT</label>
              <textarea id="contact-msg" rows="4" required placeholder="Greetings Rafia, I would like to discuss a game development opportunity..."></textarea>
            </div>
            <button type="submit" class="transmit-btn">
              <span>BROADCAST TRANSMISSION</span>
            </button>
            <div id="form-feedback" class="form-feedback"></div>
          </form>
        </div>
      </div>
    `;

    // Copy email handler
    document.getElementById('copy-email-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(contact.email).then(() => {
        const btn = document.getElementById('copy-email-btn');
        if (btn) {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        }
      });
    });

    // Form submit handler
    const form = document.getElementById('contact-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = document.getElementById('form-feedback');
      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const message = document.getElementById('contact-msg').value;

      if (feedback) {
        feedback.innerHTML = `<span style="color:#10b981;">Transmission queued successfully! Dispatching via client mail client...</span>`;
      }

      // Open mailto fallback with prefilled message
      const mailtoUrl = `mailto:${contact.email}?subject=Portfolio Transmission from ${encodeURIComponent(name)}&body=${encodeURIComponent(message + "\n\nReply To: " + email)}`;
      window.location.href = mailtoUrl;

      setTimeout(() => {
        form.reset();
      }, 1500);
    });
  }

  openControlsHelpModal() {
    this.modalTitle.textContent = "FLIGHT MANUAL // SYSTEM CONTROLS";
    this.modalSubtitle.textContent = "Third-Person Planetary Navigation Guide";

    this.modalBody.innerHTML = `
      <div class="controls-guide-grid">
        <div class="control-card">
          <div class="control-key-icon">W / A / S / D</div>
          <div class="control-info">
            <h4>Movement Vector</h4>
            <p>Move the astronaut forward, backward, strafe left and right relative to current camera heading.</p>
          </div>
        </div>

        <div class="control-card">
          <div class="control-key-icon">MOUSE DRAG / SWIPE</div>
          <div class="control-info">
            <h4>Orbital Camera Rig</h4>
            <p>Click and drag anywhere on the canvas to rotate the camera view. Scroll wheel to zoom in or out.</p>
          </div>
        </div>

        <div class="control-card">
          <div class="control-key-icon">SHIFT</div>
          <div class="control-info">
            <h4>Thruster Boost</h4>
            <p>Hold Shift while moving to activate sprint / high-speed glide mode.</p>
          </div>
        </div>

        <div class="control-card">
          <div class="control-key-icon">SPACE</div>
          <div class="control-info">
            <h4>Jetpack Hover</h4>
            <p>Engage vertical thrusters to jump and hover above the station platform.</p>
          </div>
        </div>

        <div class="control-card">
          <div class="control-key-icon">E / ENTER</div>
          <div class="control-info">
            <h4>Station Proximity Dock</h4>
            <p>When near an orbital landmark, engage to inspect its data module.</p>
          </div>
        </div>

        <div class="control-card">
          <div class="control-key-icon">HUD QUICK WARP</div>
          <div class="control-info">
            <h4>Instant Waypoint Jump</h4>
            <p>Click any landmark in the top bar to teleport directly to that sector.</p>
          </div>
        </div>
      </div>
    `;

    this.modalOverlay.classList.add('active');
  }
}
