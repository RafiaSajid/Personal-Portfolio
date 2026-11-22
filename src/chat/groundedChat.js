import { portfolioData } from '../data/portfolioData.js';

export class GroundedChat {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.lastQuery = null;

    // DOM Elements
    this.panel = document.getElementById('chat-panel');
    this.toggleBtn = document.getElementById('chat-toggle');
    this.closeBtn = document.getElementById('chat-close');
    this.messagesContainer = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.suggestionsContainer = document.getElementById('chat-suggestions');

    this.init();
  }

  init() {
    if (!this.panel) return;

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.sendBtn && this.input) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    if (this.input) {
      this.input.addEventListener('keydown', (e) => e.stopPropagation());
      this.input.addEventListener('keyup', (e) => e.stopPropagation());
    }

    this.setupSuggestions([
      "What did Rafia build for the VR Games Hub?",
      "Tell me about Eat Right Run in Unreal Engine",
      "Which certifications does Rafia hold?",
      "What did Rafia contribute to The Parallel Eclipse?",
      "What are Rafia's programming language skills?"
    ]);

    // Initial welcome message explaining RAG scope
    this.addBotMessage({
      answer: `Hello! I am **ASTRA**, Rafia Gull's grounded AI portfolio companion.\n\n` +
        `I use real-time **Retrieval-Augmented Generation (RAG)** grounded strictly on verified information from Rafia's resume.\n\n`
      ,
      sources: []
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.panel?.classList.add('open');
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'true');
    }
    if (this.input) {
      setTimeout(() => this.input.focus(), 250);
    }
  }

  close() {
    this.isOpen = false;
    this.panel?.classList.remove('open');
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  setupSuggestions(suggestions) {
    if (!this.suggestionsContainer) return;
    this.suggestionsContainer.innerHTML = '';
    suggestions.forEach((text) => {
      const btn = document.createElement('button');
      btn.className = 'chat-chip';
      btn.textContent = text;
      btn.setAttribute('aria-label', `Ask: ${text}`);
      btn.addEventListener('click', () => {
        if (this.input && !this.isLoading) {
          this.input.value = text;
          this.handleSendMessage();
        }
      });
      this.suggestionsContainer.appendChild(btn);
    });
  }

  async handleSendMessage() {
    if (this.isLoading) return;
    const text = this.input?.value.trim();
    if (!text) return;

    this.lastQuery = text;
    this.addUserMessage(text);
    this.input.value = '';

    // Show loading state
    this.isLoading = true;
    if (this.sendBtn) this.sendBtn.disabled = true;
    const loadingElem = this.showLoadingIndicator();

    try {
      // Call Serverless RAG Endpoint (/api/chat)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });

      loadingElem.remove();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      this.addBotMessage(data);

    } catch (err) {
      loadingElem.remove();
      console.warn('API call failed, attempting client-side fallback retrieval:', err.message);

      // Attempt client-side grounded retrieval fallback if server is offline
      const clientFallback = this.clientSideRetrieve(text);
      if (clientFallback) {
        this.addBotMessage(clientFallback);
      } else {
        this.showErrorMessage(err.message || 'Unable to connect to RAG server.');
      }
    } finally {
      this.isLoading = false;
      if (this.sendBtn) this.sendBtn.disabled = false;
    }
  }

  addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'msg user';
    msg.textContent = text;
    this.messagesContainer?.appendChild(msg);
    this.scrollToBottom();
  }

  addBotMessage({ answer, sources = [] }) {
    const msg = document.createElement('div');
    msg.className = 'msg bot';

    let html = `<div class="msg-content">${this.formatMarkdown(answer)}</div>`;

    // Render clickable source citations if provided
    if (sources && sources.length > 0) {
      html += `
        <div class="msg-sources" aria-label="Referenced Sources">
          <span class="sources-title">Verified Sources:</span>
          <div class="sources-list">
            ${sources.map(s => `
              <a href="${s.link || '#'}" class="source-pill" title="View details in ${s.title}" target="${s.link?.startsWith('http') ? '_blank' : '_self'}">
                <span class="source-icon">✦</span> ${this.escapeHTML(s.title)}
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    msg.innerHTML = html;
    this.messagesContainer?.appendChild(msg);
    this.scrollToBottom();
  }

  showLoadingIndicator() {
    const loading = document.createElement('div');
    loading.className = 'msg bot loading-state';
    loading.setAttribute('aria-live', 'assertive');
    loading.innerHTML = `
      <div class="loading-dots">
        <span>•</span><span>•</span><span>•</span>
      </div>
      <span class="loading-label">Searching vector index & grounding response...</span>
    `;
    this.messagesContainer?.appendChild(loading);
    this.scrollToBottom();
    return loading;
  }

  showErrorMessage(errorText) {
    const errContainer = document.createElement('div');
    errContainer.className = 'msg bot error-state';
    errContainer.innerHTML = `
      <div style="color:#ef4444; font-weight:700; margin-bottom:0.3rem;">⚠️ Transmission Error</div>
      <p style="font-size:0.8rem; color:#cbd5e1;">${this.escapeHTML(errorText)}</p>
      <button class="chat-retry-btn" aria-label="Retry query">Retry Question</button>
    `;

    errContainer.querySelector('.chat-retry-btn')?.addEventListener('click', () => {
      errContainer.remove();
      if (this.lastQuery && this.input) {
        this.input.value = this.lastQuery;
        this.handleSendMessage();
      }
    });

    this.messagesContainer?.appendChild(errContainer);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n• /g, '<br>• ');
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Client-side Vector/Keyword Retrieval fallback
   * Used only if serverless backend is completely unreachable
   */
  clientSideRetrieve(query) {
    const q = query.toLowerCase();
    const data = portfolioData;
    const matches = [];

    // Match projects
    data.projects?.forEach(p => {
      let score = 0;
      const titleLower = p.title.toLowerCase();
      if (q.includes(titleLower) || titleLower.split(' ').some(w => w.length > 3 && q.includes(w))) score += 5;
      p.technologies.forEach(t => {
        if (q.includes(t.toLowerCase())) score += 2;
      });
      if (p.contribution && q.includes('contribution')) score += 3;
      if (score > 0) {
        matches.push({
          title: `Project: ${p.title}`,
          link: `./projects.html#${p.id}`,
          content: `${p.summary}\n${p.contribution ? 'Contribution: ' + p.contribution : ''}`,
          score
        });
      }
    });

    // Match Education / Certifications
    if (q.includes('education') || q.includes('ned') || q.includes('university') || q.includes('study')) {
      matches.push({
        title: 'Education - NED University',
        link: './about.html#education',
        content: `${data.education.degree} (${data.education.specialization}) at ${data.education.institution}. Status: ${data.education.status}.`,
        score: 6
      });
    }

    if (q.includes('certif') || q.includes('cega') || q.includes('course')) {
      matches.push({
        title: 'Professional Certifications (CEGA)',
        link: './about.html#certifications',
        content: data.certifications.map(c => `${c.title} certified by ${c.issuer}: ${c.topics}`).join('\n'),
        score: 6
      });
    }

    if (q.includes('skill') || q.includes('language') || q.includes('tool') || q.includes('engine')) {
      matches.push({
        title: 'Technical Skills Matrix',
        link: './about.html#skills',
        content: data.skills.map(s => `${s.category}: ${s.items.map(i => i.name).join(', ')}`).join('\n'),
        score: 4
      });
    }

    if (matches.length === 0) return null;

    matches.sort((a, b) => b.score - a.score);
    const top = matches.slice(0, 3);
    const answer = top.map(m => `• **${m.title}**:\n${m.content}`).join('\n\n');

    return {
      answer: `*(Client offline retrieval)*:\n\n${answer}`,
      sources: top.map(m => ({ title: m.title, link: m.link }))
    };
  }
}
