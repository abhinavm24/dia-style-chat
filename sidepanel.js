// sidepanel.js
const messagesEl = document.getElementById("messages");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("composer");
const includePageEl = document.getElementById("includePage");
const sendBtn = document.getElementById("send");
const openOptionsBtn = document.getElementById("openOptions");
const exportBtn = document.getElementById("exportChat");
const clearBtn = document.getElementById("clearChat");
const settingsPanel = document.getElementById("settingsPanel");
const settingsFrame = document.getElementById("settingsFrame");
const closeSettingsBtn = document.getElementById("closeSettings");
const themeToggleBtn = document.getElementById("themeToggle");
const quickBtns = document.querySelectorAll(".action-btn");

// Preserve original send button content so we can restore it after spinners
if (sendBtn && !sendBtn.dataset.defaultHtml) {
  sendBtn.dataset.defaultHtml = sendBtn.innerHTML;
}

let history = []; // {role:'user'|'model', text:string}
let streamCounter = 0;
let currentTabId = null;
let currentOrigin = null;
let isTyping = false;
let isSending = false;
let currentTheme = 'system'; // Default to system to respect OS
let prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
let systemThemeListener = null;

// Theme management
function setTheme(theme) {
  currentTheme = theme;
  // If System: mirror OS preference and react to changes
  if (theme === 'system') {
    // Apply current system theme
    const isDark = !!prefersDarkMedia.matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    // Attach change listener once
    if (!systemThemeListener) {
      systemThemeListener = (e) => {
        if (currentTheme === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
      if (prefersDarkMedia.addEventListener) {
        prefersDarkMedia.addEventListener('change', systemThemeListener);
      } else if (prefersDarkMedia.addListener) {
        // Safari fallback
        prefersDarkMedia.addListener(systemThemeListener);
      }
    }
  } else {
    // Non-system: remove listener if present and set explicit theme
    if (systemThemeListener) {
      if (prefersDarkMedia.removeEventListener) {
        prefersDarkMedia.removeEventListener('change', systemThemeListener);
      } else if (prefersDarkMedia.removeListener) {
        prefersDarkMedia.removeListener(systemThemeListener);
      }
      systemThemeListener = null;
    }
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Update theme toggle button icon
  const icon = themeToggleBtn.querySelector('.icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '🌓';
  }
  
  // Save theme preference
  chrome.storage.sync.set({ theme: theme });
}

function toggleTheme() {
  const order = ['light', 'dark', 'system'];
  const idx = order.indexOf(currentTheme);
  const next = order[(idx + 1 + order.length) % order.length] || 'system';
  setTheme(next);
}

// Initialize theme
async function initTheme() {
  const { theme } = await chrome.storage.sync.get({ theme: 'system' });
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
  if (role === 'assistant') {
    div.innerHTML = formatMessage(text, false);
    attachCopyActions(div, text);
  } else {
    div.textContent = text;
  }
  
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

// Simple prompt clamp to avoid excessive payloads
function clampPrompt(str, max = 4000) {
  const s = String(str || '').trim();
  return s.length > max ? s.slice(0, max) : s;
}

// Error banner with Retry and Settings actions
function showErrorBanner(message, code, onRetry) {
  const app = document.getElementById('app') || document.body;
  // Remove existing banner if present
  const existing = app.querySelector('.error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:8px',
    'position:sticky',
    'top:0',
    'z-index:100',
    'padding:10px 12px',
    'margin:8px',
    'border-radius:10px',
    'background: var(--danger-bg, #fee2e2)',
    'color: var(--danger-fg, #991b1b)',
    'border:1px solid var(--danger-br, #fecaca)'
  ].join(';');

  const text = document.createElement('div');
  text.style.flex = '1';
  text.textContent = `⚠️ ${message}`;
  banner.appendChild(text);

  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.className = 'btn-retry';
  retryBtn.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);cursor:pointer;';
  retryBtn.onclick = () => { banner.remove(); if (typeof onRetry === 'function') onRetry(); };
  banner.appendChild(retryBtn);

  const settingsBtn = document.createElement('button');
  settingsBtn.textContent = 'Settings';
  settingsBtn.className = 'btn-settings';
  settingsBtn.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);cursor:pointer;';
  settingsBtn.onclick = () => { banner.remove(); openSettingsInPanel(); };
  // Prefer showing Settings when key/model issues
  if (code === 'MISSING_KEY' || code === 'BAD_MODEL') {
    banner.appendChild(settingsBtn);
  } else {
    banner.appendChild(settingsBtn);
  }

  app.prepend(banner);
  // Auto dismiss after 10s
  setTimeout(() => { if (banner && banner.parentNode) banner.remove(); }, 10000);
}

function updateMessage(el, more) {
  // rAF-batched streaming flush: store full text and render markdown per frame
  const prev = el.dataset.fullText || '';
  const next = prev + more;
  el.dataset.fullText = next;
  scheduleRender(el);
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
    if (sendBtn) sendBtn.innerHTML = '<span class="loading" aria-hidden="true"></span>';
  } else {
    const prevPh = promptEl.getAttribute('data-prev-ph') || 'Ask about this page…';
    promptEl.setAttribute('placeholder', prevPh);
    if (sendBtn) {
      const fallbackArrow = `
        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3c.28 0 .53.11.71.29l7 7a1 1 0 01-1.42 1.42L13 6.41V20a1 1 0 11-2 0V6.41L5.71 11.7a1 1 0 01-1.42-1.42l7-7A1 1 0 0112 3z"/>
        </svg>`;
      sendBtn.innerHTML = sendBtn.dataset.defaultHtml || fallbackArrow.trim();
    }
  }
}

// Render scheduling for streaming
let rafPending = false;
const renderQueue = new Set();
function scheduleRender(el) {
  renderQueue.add(el);
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    renderQueue.forEach((node) => {
      const full = node.dataset.fullText || node.textContent || '';
      node.innerHTML = formatMessage(full, false);
      attachCopyActions(node, full);
    });
    renderQueue.clear();
    rafPending = false;
    if (isNearBottom()) scrollToBottom(false);
  });
}

async function askGemini(question, opts = {}) {
  question = clampPrompt(question);
  if (!question) return;
  if (isSending) return;
  setBusy(true, 'Sending…');
  
  const userEl = addMessage("user", question);
  history.push({ role: "user", text: question });
  persistHistory();

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
      // Offer retry and settings
      showErrorBanner(res.error, res.code, () => askGemini(question, opts));
      return;
    }
    if (!streamed) {
      updateMessage(assistantEl, res.text || "");
      buffer = res.text || "";
    }
    history.push({ role: "model", text: buffer });
    // Persist after assistant reply
    persistHistory();
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
  // Live-sync theme changes from other pages (e.g., options)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.theme) {
      setTheme(changes.theme.newValue);
    }
  });
  
  currentTabId = await getActiveTabId();
  // Determine origin via snapshot
  try {
    const snap = await chrome.tabs.sendMessage(currentTabId, { type: 'EXTRACT_PAGE' });
    try { currentOrigin = new URL(snap?.url || '').origin; } catch { currentOrigin = null; }
  } catch { currentOrigin = null; }
  await loadHistory();
  
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
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessage(text, isDelta = false) {
  // Escape any HTML to avoid injecting styles/scripts/fonts from model or page content
  let safe = escapeHtml(text);
  if (!isDelta) {
    // Fenced code blocks ```lang\n...```
    safe = safe.replace(/```([\w+-]*)\n([\s\S]*?)```/g, (m, lang, code) => {
      return `<pre class="code-block"><code data-lang="${escapeHtml(lang)}">${code}</code></pre>`;
    });
    // Inline markdown
    safe = safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  } else {
    safe = safe.replace(/\n/g, '<br>');
  }
  return safe;
}

// Copy actions
function attachCopyActions(container, fullText) {
  // Avoid duplicating action bars
  if (container.querySelector('.msg-actions')) return;
  const bar = document.createElement('div');
  bar.className = 'msg-actions';
  bar.style.cssText = 'display:flex; gap:8px; justify-content:flex-end; margin-top:6px;';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.title = 'Copy message';
  copyBtn.style.cssText = 'padding:4px 8px; border-radius:8px; border:1px solid var(--border); background:var(--card); cursor:pointer;';
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(fullText || container.innerText || ''); } catch {}
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1500);
  };
  bar.appendChild(copyBtn);

  // Add copy buttons for code blocks
  container.querySelectorAll('pre.code-block').forEach((pre) => {
    const btn = document.createElement('button');
    btn.textContent = 'Copy code';
    btn.style.cssText = 'margin-left:8px; padding:3px 6px; border-radius:6px; border:1px solid var(--border); background:var(--card); cursor:pointer;';
    btn.onclick = async (e) => {
      e.stopPropagation();
      const code = pre.querySelector('code')?.textContent || '';
      try { await navigator.clipboard.writeText(code); } catch {}
      const prev = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = prev, 1200);
    };
    bar.appendChild(btn);
  });

  container.appendChild(bar);
}

// History persistence per-origin
function historyKey() {
  return currentOrigin ? `tc:h:${currentOrigin}` : null;
}

async function loadHistory() {
  const key = historyKey();
  if (!key) return;
  try {
    const data = await chrome.storage.local.get({ [key]: [] });
    const items = Array.isArray(data[key]) ? data[key] : [];
    history = items;
    // Render
    items.forEach((m) => addMessage(m.role, m.text));
  } catch {}
}

function capHistory(items) {
  // Cap turns and bytes
  let arr = items.slice(-20);
  let blob = JSON.stringify(arr);
  while (blob.length > 64 * 1024 && arr.length > 1) {
    arr = arr.slice(1);
    blob = JSON.stringify(arr);
  }
  return arr;
}

async function persistHistory() {
  const key = historyKey();
  if (!key) return;
  const capped = capHistory(history);
  history = capped;
  try { await chrome.storage.local.set({ [key]: capped }); } catch {}
}

function exportHistory() {
  const dt = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `tab-chat-${dt}`;
  // JSON
  const json = JSON.stringify(history, null, 2);
  const a1 = document.createElement('a');
  a1.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a1.download = `${base}.json`;
  a1.click();
  // Markdown
  const md = history.map((m) => (m.role === 'user' ? `You: ${m.text}` : `Assistant: ${m.text}`)).join('\n\n');
  const a2 = document.createElement('a');
  a2.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
  a2.download = `${base}.md`;
  a2.click();
}

async function clearHistory() {
  const key = historyKey();
  if (!key) return;
  try { await chrome.storage.local.remove(key); } catch {}
  history = [];
  messagesEl.innerHTML = '';
}

// Wire header buttons
if (exportBtn) exportBtn.onclick = () => exportHistory();
if (clearBtn) clearBtn.onclick = () => clearHistory();
