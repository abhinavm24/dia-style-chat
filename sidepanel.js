// sidepanel.js
const messagesEl = document.getElementById("messages");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("composer");
const includePageEl = document.getElementById("includePage");
const sendBtn = document.getElementById("send");
const openOptionsBtn = document.getElementById("openOptions");
const settingsPanel = document.getElementById("settingsPanel");
const settingsFrame = document.getElementById("settingsFrame");
const closeSettingsBtn = document.getElementById("closeSettings");
const themeToggleBtn = document.getElementById("themeToggle");
const quickBtns = document.querySelectorAll(".action-btn");

let history = []; // {role:'user'|'model', text:string}
let streamCounter = 0;
let currentTabId = null;
let isTyping = false;
let isSending = false;
let currentTheme = 'light'; // Default theme

// Theme management
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme toggle button icon
  const icon = themeToggleBtn.querySelector('i');
  if (theme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
  
  // Save theme preference
  chrome.storage.sync.set({ theme: theme });
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Initialize theme
async function initTheme() {
  const { theme } = await chrome.storage.sync.get({ theme: 'light' });
  setTheme(theme);
}

// Enhanced UI interactions
function openSettingsInPanel() {
  if (!settingsFrame.getAttribute('src')) {
    settingsFrame.src = chrome.runtime.getURL('options.html');
  }
  settingsPanel.classList.add('open');
  settingsPanel.setAttribute('aria-hidden', 'false');
}

function closeSettingsPanel() {
  settingsPanel.classList.remove('open');
  settingsPanel.setAttribute('aria-hidden', 'true');
}

openOptionsBtn.onclick = openSettingsInPanel;
if (closeSettingsBtn) closeSettingsBtn.onclick = closeSettingsPanel;
// Close settings when pressing Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsPanel.classList.contains('open')) {
    closeSettingsPanel();
  }
});
themeToggleBtn.onclick = toggleTheme;

quickBtns.forEach((b) => b.addEventListener("click", async (e) => {
  e.preventDefault();
  if (isSending) return;
  let tmpl = b.dataset.template || '';

  // Try to fetch current selection from the active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const snap = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE' });
      const sel = (snap?.selection || '').trim();
      if (sel) {
        // Normalize common phrasing to use selection
        const patterns = [/selected text/i, /this page/i, /the page/i, /this article/i, /this content/i];
        let matched = false;
        for (const re of patterns) {
          if (re.test(tmpl)) {
            tmpl = tmpl.replace(re, 'the following text');
            matched = true;
            break;
          }
        }
        // Attach the selected text
        if (matched) {
          tmpl = `${tmpl}\n\n${sel}`;
        } else {
          tmpl = `${tmpl}\n\nUse only the following text:\n\n${sel}`;
        }
      }
    }
  } catch (_) {
    // ignore if we can't read selection; fall back to template only
  }

  // Auto-send the quick action without requiring the Send click
  if (tmpl.trim()) {
    // Clear the prompt immediately for snappy UX
    promptEl.value = '';
    await askGemini(tmpl);
  }
  // Keep focus ready for next input
  promptEl.focus();
  // Add subtle animation feedback
  b.style.transform = 'scale(0.95)';
  setTimeout(() => b.style.transform = '', 150);
}));

// Add hover effects for quick action buttons
quickBtns.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px) scale(1.02)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0) scale(1)';
  });
});

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

// Enhanced auto-scroll functionality
function scrollToBottom(smooth = true) {
  messagesEl.scrollTo({
    top: messagesEl.scrollHeight,
    behavior: 'smooth'
  });
}

function isNearBottom() {
  const threshold = 100; // pixels from bottom
  return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = formatMessage(text);
  
  // Add entrance animation
  div.style.opacity = '0';
  div.style.transform = 'translateY(20px)';
  div.style.transition = 'all 0.3s ease';
  
  messagesEl.appendChild(div);
  
  // Trigger animation
  setTimeout(() => {
    div.style.opacity = '1';
    div.style.transform = 'translateY(0)';
  }, 50);
  
  // Auto-scroll to bottom
  scrollToBottom();
  return div;
}

function updateMessage(el, more) {
  el.innerHTML += formatMessage(more, true);
  
  // Only auto-scroll if user is near bottom
  if (isNearBottom()) {
    scrollToBottom(false);
  }
}

function showTypingIndicator() {
  if (isTyping) return;
  
  isTyping = true;
  const typingEl = document.createElement("div");
  typingEl.className = "msg assistant typing-indicator";
  typingEl.innerHTML = `
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  
  messagesEl.appendChild(typingEl);
  scrollToBottom();
  return typingEl;
}

function hideTypingIndicator(typingEl) {
  if (typingEl && typingEl.parentNode) {
    typingEl.style.opacity = '0';
    typingEl.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }
    }, 300);
  }
  isTyping = false;
}

function setBusy(busy, placeholderText) {
  isSending = busy;
  promptEl.disabled = busy;
  sendBtn.disabled = busy;
  quickBtns.forEach(btn => btn.disabled = busy);
  promptEl.setAttribute('aria-busy', String(busy));
  if (busy) {
    // Show sending placeholder and spinner
    const prevPh = promptEl.getAttribute('data-prev-ph') || promptEl.getAttribute('placeholder') || '';
    promptEl.setAttribute('data-prev-ph', prevPh);
    promptEl.setAttribute('placeholder', placeholderText || 'Sending…');
    if (sendBtn) sendBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
  } else {
    const prevPh = promptEl.getAttribute('data-prev-ph') || 'Ask about this page…';
    promptEl.setAttribute('placeholder', prevPh);
    if (sendBtn) sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  }
}

async function askGemini(question, opts = {}) {
  if (!question.trim()) return;
  if (isSending) return;
  setBusy(true, 'Sending…');
  
  const userEl = addMessage("user", question);
  history.push({ role: "user", text: question });

  const streamId = `s${Date.now()}_${streamCounter++}`;
  
  // Show typing indicator
  const typingEl = showTypingIndicator();

  const tabId = currentTabId || (await getActiveTabId());
  const includePage = includePageEl.checked;

  let assistantEl;
  let buffer = "";
  let streamed = false;

  // listen for streaming deltas
  const onStream = (msg, sender, sendResponse) => {
    if (msg?.type === "STREAM_DELTA" && msg.streamId === streamId) {
      if (!streamed) {
        streamed = true;
        hideTypingIndicator(typingEl);
        assistantEl = addMessage("assistant", "");
        // Re-enable input as soon as streaming starts
        setBusy(false);
      }
      buffer += msg.delta;
      updateMessage(assistantEl, msg.delta);
    }
  };
  chrome.runtime.onMessage.addListener(onStream);

  try {
    // Switch to waiting state while the request is in-flight
    setBusy(true, 'Waiting for response…');
    const res = await chrome.runtime.sendMessage({
      type: "ASK_GEMINI",
      tabId,
      question,
      includePage,
      history,
      streamId,
      stream: true
    });

    chrome.runtime.onMessage.removeListener(onStream);
    
    if (!streamed) {
      hideTypingIndicator(typingEl);
      assistantEl = addMessage("assistant", "");
      // No streaming case: re-enable now that assistant message started
      setBusy(false);
    }

    if (res?.error) {
      updateMessage(assistantEl, `⚠️ ${res.error}`);
      return;
    }
    if (!streamed) {
      updateMessage(assistantEl, res.text || "");
      buffer = res.text || "";
    }
    history.push({ role: "model", text: buffer });
  } catch (e) {
    chrome.runtime.onMessage.removeListener(onStream);
    if (!streamed) {
      hideTypingIndicator(typingEl);
      addMessage("assistant", `⚠️ ${e.message || e}`);
    } else {
      updateMessage(assistantEl, `⚠️ ${e.message || e}`);
    }
    setBusy(false);
  }
}

// Enhanced form handling
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSending) return;
  const q = promptEl.value;
  if (!q.trim()) return;
  // Clear immediately upon sending
  promptEl.value = '';
  await askGemini(q);
});

// Add input focus effects
promptEl.addEventListener('focus', () => {
  promptEl.parentElement.style.borderColor = 'var(--accent)';
  promptEl.parentElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
});

promptEl.addEventListener('blur', () => {
  promptEl.parentElement.style.borderColor = 'var(--border)';
  promptEl.parentElement.style.boxShadow = 'none';
});

// Add enter key handling for better UX
promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.dispatchEvent(new Event('submit'));
  }
});

// Enhanced initialization
(async function init() {
  // Initialize theme first
  await initTheme();
  
  currentTabId = await getActiveTabId();
  
  // Remove the default welcome message since we have a better one in HTML
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.display = 'block';
  }
  
  // Show a friendly hint if no key yet
  const { geminiApiKey } = await chrome.storage.sync.get({ geminiApiKey: "" });
  if (!geminiApiKey) {
    // Hide the welcome message and show the API key message
    if (welcomeMessage) {
      welcomeMessage.style.display = 'none';
    }
    
    addMessage(
      "assistant",
      "🔑 Add your Gemini API key in Settings (⚙️) to start chatting with this tab."
    );
  } else {
    // Hide the welcome message after a few seconds
    if (welcomeMessage) {
      setTimeout(() => {
        welcomeMessage.style.opacity = '0';
        welcomeMessage.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          welcomeMessage.style.display = 'none';
        }, 300);
      }, 10000);
    }
  }
  
  // Add some subtle animations to the UI
  setTimeout(() => {
    document.querySelectorAll('.action-btn').forEach((btn, index) => {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(20px)';
      setTimeout(() => {
        btn.style.transition = 'all 0.3s ease';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, 500);
})();

// Enhanced message display with markdown-like formatting
function formatMessage(text, isDelta = false) {
  // Simple formatting for better readability
  let formatted = text;
  if (!isDelta) {
    // Full message formatting
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  } else {
    // For deltas, just handle newlines
    formatted = formatted.replace(/\n/g, '<br>');
  }
  return formatted;
}
