// sidepanel.js
const messagesEl = document.getElementById("messages");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("composer");
const includePageEl = document.getElementById("includePage");
const openOptionsBtn = document.getElementById("openOptions");
const quickBtns = document.querySelectorAll(".action-btn");

let history = []; // {role:'user'|'model', text:string}
let streamCounter = 0;
let currentTabId = null;
let isTyping = false;

// Enhanced UI interactions
openOptionsBtn.onclick = () => chrome.runtime.openOptionsPage();

quickBtns.forEach((b) => b.addEventListener("click", () => {
  promptEl.value = b.dataset.template;
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

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  
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
  
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function updateMessage(el, more) {
  el.textContent += more;
  messagesEl.scrollTop = messagesEl.scrollHeight;
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
  messagesEl.scrollTop = messagesEl.scrollHeight;
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

async function askGemini(question, opts = {}) {
  if (!question.trim()) return;
  
  const userEl = addMessage("user", question);
  history.push({ role: "user", text: question });

  const streamId = `s${Date.now()}_${streamCounter++}`;
  const assistantEl = addMessage("assistant", "");
  
  // Show typing indicator
  const typingEl = showTypingIndicator();

  const tabId = currentTabId || (await getActiveTabId());
  const includePage = includePageEl.checked;

  // listen for streaming deltas
  const onStream = (msg, sender, sendResponse) => {
    if (msg?.type === "STREAM_DELTA" && msg.streamId === streamId) {
      hideTypingIndicator(typingEl);
      updateMessage(assistantEl, msg.delta);
    }
  };
  chrome.runtime.onMessage.addListener(onStream);

  try {
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
    hideTypingIndicator(typingEl);

    if (res?.error) {
      updateMessage(assistantEl, `⚠️ ${res.error}`);
      return;
    }
    if (!res.streamed) {
      updateMessage(assistantEl, res.text || "");
    }
    history.push({ role: "model", text: assistantEl.textContent });
  } catch (e) {
    chrome.runtime.onMessage.removeListener(onStream);
    hideTypingIndicator(typingEl);
    updateMessage(assistantEl, `⚠️ ${e.message || e}`);
  } finally {
    promptEl.value = "";
  }
}

// Enhanced form handling
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  await askGemini(promptEl.value);
});

// Add input focus effects
promptEl.addEventListener('focus', () => {
  promptEl.parentElement.style.borderColor = 'var(--accent)';
  promptEl.parentElement.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
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
      }, 3000);
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

// Add smooth scrolling for better UX
function smoothScrollToBottom() {
  messagesEl.scrollTo({
    top: messagesEl.scrollHeight,
    behavior: 'smooth'
  });
}

// Enhanced message display with markdown-like formatting
function formatMessage(text) {
  // Simple formatting for better readability
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
