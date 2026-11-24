/**
 * FooterManager
 * Initializes the space-themed animated footer and manages legal modal dialogs
 * (Privacy Policy and Terms of Use).
 */

export class FooterManager {
  constructor() {
    this.modal = document.getElementById('legal-modal');
    this.modalTitle = document.getElementById('legal-modal-title');
    this.modalBody = document.getElementById('legal-modal-body');
    this.modalClose = document.getElementById('legal-modal-close');

    this.init();
  }

  init() {
    // Attach trigger listeners
    document.querySelectorAll('[data-legal-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.getAttribute('data-legal-trigger');
        this.openLegalModal(type);
      });
    });

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeLegalModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeLegalModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('open')) {
        this.closeLegalModal();
      }
    });
  }

  openLegalModal(type) {
    if (!this.modal || !this.modalTitle || !this.modalBody) return;

    if (type === 'privacy') {
      this.modalTitle.textContent = 'PRIVACY POLICY';
      this.modalBody.innerHTML = `
        <p><strong>Last Updated:</strong> November 2026</p>
        <h4>Information Collection</h4>
        <p>This personal portfolio website does not employ commercial third-party advertising trackers or sell personal visitor data. When you submit a dispatch using the contact form, the details you supply (your name, email address, subject, and message text) are transmitted securely to deliver your message to Rafia Gull.</p>
        <h4>Local Storage & Preferences</h4>
        <p>This website stores local display preferences (such as light/dark theme preference) directly within your browser's local storage. This information never leaves your personal device.</p>
        <h4>AI Companion (ASTRA)</h4>
        <p>Questions submitted to the ASTRA AI companion are evaluated strictly against the portfolio's published structured records. We do not use your chat inquiries for public model training.</p>
        <h4>Contact & Inquiries</h4>
        <p>For questions regarding your communication or data inquiries, please reach out via the on-site contact form.</p>
      `;
    } else if (type === 'terms') {
      this.modalTitle.textContent = 'TERMS OF USE';
      this.modalBody.innerHTML = `
        <p><strong>Last Updated:</strong> November 2026</p>
        <h4>Portfolio Scope & Purpose</h4>
        <p>This website serves as an interactive portfolio showcasing the academic work, game development projects, and software demonstrations of Rafia Gull, a Computer Science student at NED University specializing in Gaming and Animation.</p>
        <h4>Intellectual Property</h4>
        <p>All project descriptions, game logic implementations, scripts, custom 3D assets, and media presented are the intellectual property of Rafia Gull or their respective institutional/course contexts unless otherwise noted. Demonstration code is provided for evaluation, hiring, and educational review.</p>
        <h4>External Links & Demonstrations</h4>
        <p>This portfolio may include links to external websites, institutional programs (such as NED University and CEGA certifications), and repository hosts. Rafia Gull is not responsible for the content or practices of external third-party sites.</p>
      `;
    }

    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.modalClose?.focus();
  }

  closeLegalModal() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
  }
}
