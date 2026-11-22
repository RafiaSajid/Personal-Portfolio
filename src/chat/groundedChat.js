import { portfolioData } from '../data/portfolioData.js';

export class GroundedChat {
  constructor() {
    this.history = [];
    this.isOpen = false;

    // Chat DOM elements
    this.chatWidget = document.getElementById('chat-widget');
    this.chatToggleBtn = document.getElementById('chat-toggle-btn');
    this.chatCloseBtn = document.getElementById('chat-close-btn');
    this.chatMessagesContainer = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.chatSendBtn = document.getElementById('chat-send-btn');
    this.chatSuggestions = document.getElementById('chat-suggestions');

    this.init();
  }

  init() {
    if (!this.chatWidget) return;

    // Event listeners
    if (this.chatToggleBtn) {
      this.chatToggleBtn.addEventListener('click', () => this.toggle());
    }

    if (this.chatCloseBtn) {
      this.chatCloseBtn.addEventListener('click', () => this.close());
    }

    if (this.chatSendBtn && this.chatInput) {
      this.chatSendBtn.addEventListener('click', () => this.handleSendMessage());
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Suggestions setup
    this.setupSuggestions([
      "What is Rafia's specialization?",
      "Tell me about the 3D Space Journey",
      "Which game engines does Rafia know?",
      "How do I contact Rafia?",
      "Show me Rafia's projects"
    ]);

    // Initial greeting
    this.addBotMessage(
      `Hello, Explorer! I am **ASTRA**, Rafia's navigational AI companion. Feel free to ask me anything about Rafia's game development projects, technical skills in gaming & animation, or how to get in touch!`
    );
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.chatWidget.classList.add('active');
      if (this.chatInput) this.chatInput.focus();
    } else {
      this.chatWidget.classList.remove('active');
    }
  }

  open() {
    this.isOpen = true;
    if (this.chatWidget) {
      this.chatWidget.classList.add('active');
      if (this.chatInput) this.chatInput.focus();
    }
  }

  close() {
    this.isOpen = false;
    if (this.chatWidget) {
      this.chatWidget.classList.remove('active');
    }
  }

  setupSuggestions(suggestions) {
    if (!this.chatSuggestions) return;
    this.chatSuggestions.innerHTML = '';
    suggestions.forEach((text) => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggestion-chip';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        if (this.chatInput) {
          this.chatInput.value = text;
          this.handleSendMessage();
        }
      });
      this.chatSuggestions.appendChild(btn);
    });
  }

  handleSendMessage() {
    const text = this.chatInput?.value.trim();
    if (!text) return;

    // Add user message
    this.addUserMessage(text);
    this.chatInput.value = '';

    // Show typing indicator
    const typingElem = this.showTypingIndicator();

    setTimeout(() => {
      typingElem.remove();
      const response = this.generateGroundedResponse(text);
      this.addBotMessage(response);
    }, 450);
  }

  addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user-msg';
    msg.textContent = text;
    this.chatMessagesContainer?.appendChild(msg);
    this.scrollToBottom();
  }

  addBotMessage(markdownText) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot-msg';
    msg.innerHTML = this.formatMarkdown(markdownText);
    this.chatMessagesContainer?.appendChild(msg);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot-msg typing-indicator';
    typing.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    this.chatMessagesContainer?.appendChild(typing);
    this.scrollToBottom();
    return typing;
  }

  scrollToBottom() {
    if (this.chatMessagesContainer) {
      this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
    }
  }

  formatMarkdown(text) {
    // Lightweight markdown parser for bold, links, lists, code
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- /g, '<br>• ');
    return html;
  }

  // Strictly grounded response generator using portfolioData
  generateGroundedResponse(query) {
    const q = query.toLowerCase();
    const data = portfolioData;

    // 1. Identity, Specialization & Bio
    if (q.includes('who is') || q.includes('about') || q.includes('specializ') || q.includes('degree') || q.includes('student') || q.includes('education')) {
      return `**${data.profile.name}** is an **${data.profile.role}** and Computer Science student specializing in **${data.profile.specialization}**.\n\n` +
        `• **Mission**: ${data.profile.tagline}\n` +
        `• **Education**: ${data.profile.education.degree} (${data.profile.education.focus})\n\n` +
        `Rafia focuses on real-time rendering, 3D math, physics-driven interactions, and player immersion across modern game engines and WebGL!`;
    }

    // 2. Specific Project Queries
    if (q.includes('space journey') || q.includes('three.js') || q.includes('portfolio website') || q.includes('web3d')) {
      const proj = data.projects.find((p) => p.id === 'project-space-journey');
      return `**${proj.title}** is this very website! It is a real-time, third-person 3D space journey built using **Three.js, WebGL, HTML5, and CSS3** without any heavy frontend frameworks.\n\n` +
        `• **Features**: Procedural celestial scene, custom 3rd person character controller, interactive orbital landmarks, and full mobile touch controls.\n` +
        `• **Tech**: ${proj.technologies.join(', ')}`;
    }

    if (q.includes('gameplay') || q.includes('platformer') || q.includes('mechanic')) {
      const proj = data.projects.find((p) => p.id === 'project-gameplay-prototype');
      return `**${proj.title}**:\n` +
        `${proj.summary}\n\n` +
        `• **Details**: ${proj.details}\n` +
        `• **Stack**: ${proj.technologies.join(', ')}`;
    }

    if (q.includes('animation') || q.includes('rigging') || q.includes('walk') || q.includes('blender')) {
      const proj = data.projects.find((p) => p.id === 'project-animation-study');
      return `**${proj.title}**:\n` +
        `${proj.summary}\n\n` +
        `• **Focus**: ${proj.details}\n` +
        `• **Tools**: ${proj.technologies.join(', ')}`;
    }

    if (q.includes('project') || q.includes('games') || q.includes('work') || q.includes('portfolio')) {
      let reply = `Here are the key projects featured in Rafia's portfolio:\n`;
      data.projects.forEach((p) => {
        reply += `\n• **${p.title}** (${p.category}): ${p.summary}`;
      });
      reply += `\n\nYou can explore them directly in **The Orbital Hangar** landmark or via the Projects button in the HUD!`;
      return reply;
    }

    // 3. Skills, Engine & Language Queries
    if (q.includes('skill') || q.includes('engine') || q.includes('unity') || q.includes('unreal') || q.includes('language') || q.includes('c++') || q.includes('c#') || q.includes('tech stack')) {
      let reply = `**Rafia's Technical Skillset Matrix:**\n`;
      data.skills.forEach((cat) => {
        reply += `\n**${cat.category}**:\n`;
        cat.items.forEach((item) => {
          reply += `• **${item.name}** (${item.level}) - ${item.desc}\n`;
        });
      });
      return reply;
    }

    // 4. Contact & Socials
    if (q.includes('contact') || q.includes('email') || q.includes('github') || q.includes('hire') || q.includes('reach') || q.includes('linkedin')) {
      return `You can get in touch with Rafia Gull via the **Deep Space Relay** station or the following channels:\n\n` +
        `• **Email**: ${data.profile.contact.email}\n` +
        `• **GitHub**: [Rafia's GitHub](${data.profile.contact.github})\n` +
        `• **LinkedIn**: [Rafia's LinkedIn](${data.profile.contact.linkedin})\n` +
        `• **Status**: ${data.profile.contact.location}\n\n` +
        `You can also use the message form on the Deep Space Relay screen!`;
    }

    // 5. Controls & How to play
    if (q.includes('control') || q.includes('how to play') || q.includes('how to move') || q.includes('wasd')) {
      return `**Exploration Controls:**\n` +
        `• **Move**: W/A/S/D or Arrow keys (or the on-screen joystick on touch devices)\n` +
        `• **Look / Orbit**: Click & drag on background / swipe screen\n` +
        `• **Boost / Sprint**: Hold Shift\n` +
        `• **Jetpack / Hover**: Space bar\n` +
        `• **Inspect Station**: Press **E** or click the interaction prompt when approaching a station\n` +
        `• **Quick Warp**: Use the navigation buttons at the top of the HUD to teleport instantly!`;
    }

    // Fallback grounded answer
    return `I am programmed with verified data on **Rafia Gull's** game development journey, computer science studies in Gaming & Animation, 3D projects, and skills.\n\n` +
      `Feel free to ask about:\n` +
      `• Rafia's background and specialization\n` +
      `• The 3D Space Journey or Game Projects\n` +
      `• Game engines, C++, C#, Three.js, or animation tools\n` +
      `• How to connect with Rafia`;
  }
}
