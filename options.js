// options.js
const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");
const streamEl = document.getElementById("stream");
const saveBtn = document.getElementById("save");
const themeBtns = document.querySelectorAll(".theme-btn");

let currentTheme = 'light';

// Theme management
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update active button state
  themeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.theme === theme) {
      btn.classList.add('active');
    }
  });
  
  // Save theme preference
  chrome.storage.sync.set({ theme: theme });
}

// Initialize theme
async function initTheme() {
  const { theme } = await chrome.storage.sync.get({ theme: 'light' });
  setTheme(theme);
}

// Theme button event listeners
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setTheme(btn.dataset.theme);
  });
});

async function load() {
  const { geminiApiKey, geminiModel, enableStreaming } = await chrome.storage.sync.get({
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash-lite",
    enableStreaming: true
  });
  apiKeyEl.value = geminiApiKey;
  modelEl.value = geminiModel;
  streamEl.checked = enableStreaming;
}

async function save() {
  await chrome.storage.sync.set({
    geminiApiKey: apiKeyEl.value.trim(),
    geminiModel: modelEl.value.trim(),
    enableStreaming: streamEl.checked
  });
  
  // Enhanced save feedback
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Saved ✓";
  saveBtn.style.background = "#10b981";
  
  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = "";
  }, 2000);
}

// Event listeners
saveBtn.addEventListener("click", save);

// Initialize everything
(async function init() {
  await initTheme();
  await load();
})();
