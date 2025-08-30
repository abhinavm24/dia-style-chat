// options.js
const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");
const streamEl = document.getElementById("stream");
const saveBtn = document.getElementById("save");
// No theme controls in options; theme follows side panel

let currentTheme = 'system';
let prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
let systemThemeListener = null;

// Theme management
function setTheme(theme) {
  currentTheme = theme;
  if (theme === 'system') {
    const isDark = !!prefersDarkMedia.matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (!systemThemeListener) {
      systemThemeListener = (e) => {
        if (currentTheme === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
      if (prefersDarkMedia.addEventListener) {
        prefersDarkMedia.addEventListener('change', systemThemeListener);
      } else if (prefersDarkMedia.addListener) {
        prefersDarkMedia.addListener(systemThemeListener);
      }
    }
  } else {
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
}

// Initialize theme
async function initTheme() {
  const { theme } = await chrome.storage.sync.get({ theme: 'system' });
  setTheme(theme);
}

// No toggle here; options reflects stored theme on load

async function load() {
  const { geminiApiKey, geminiModel, enableStreaming } = await chrome.storage.sync.get({
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash-lite",
    enableStreaming: false
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
  // Live-sync theme changes from other pages (e.g., side panel)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.theme) {
      setTheme(changes.theme.newValue);
    }
  });
})();
