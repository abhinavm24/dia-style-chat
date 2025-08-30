// sidepanel.js
const messagesEl = document.getElementById("messages");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("composer");
const includePageEl = document.getElementById("includePage");
const openOptionsBtn = document.getElementById("openOptions");
const quickBtns = document.querySelectorAll(".quick-actions button");

let history = []; // {role:'user'|'model', text:string}
let streamCounter = 0;
let currentTabId = null;

openOptionsBtn.onclick = () => chrome.runtime.openOptionsPage();
quickBtns.forEach((b) => b.addEventListener("click", () => {
  promptEl.value = b.dataset.template;
  promptEl.focus();
}));

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function updateMessage(el, more) {
  el.textContent += more;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function askGemini(question, opts = {}) {
  if (!question.trim()) return;
  const userEl = addMessage("user", question);
  history.push({ role: "user", text: question });

  const streamId = `s${Date.now()}_${streamCounter++}`;
  const assistantEl = addMessage("assistant", "");

  const tabId = currentTabId || (await getActiveTabId());
  const includePage = includePageEl.checked;

  // listen for streaming deltas
  const onStream = (msg, sender, sendResponse) => {
    if (msg?.type === "STREAM_DELTA" && msg.streamId === streamId) {
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
    updateMessage(assistantEl, `⚠️ ${e.message || e}`);
  } finally {
    promptEl.value = "";
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  await askGemini(promptEl.value);
});

(async function init() {
  currentTabId = await getActiveTabId();
  // Show a friendly hint if no key yet
  const { geminiApiKey } = await chrome.storage.sync.get({ geminiApiKey: "" });
  if (!geminiApiKey) {
    addMessage(
      "assistant",
      "Add your Gemini API key in Settings (⚙️) to start chatting with this tab."
    );
  } else {
    addMessage("assistant", "You're set! Ask about the page, or use the quick actions above.");
  }
})();
