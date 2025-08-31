// lib/settings.js
// Centralized settings access with sane defaults.

export const DEFAULTS = Object.freeze({
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash-lite",
  enableStreaming: false,
  theme: "system",
  scrollSpeed: "normal" // slow | normal | fast
});

export async function getSettings(overrides = {}) {
  const fromStorage = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...fromStorage, ...overrides };
}

export async function setSettings(partial) {
  await chrome.storage.sync.set(partial || {});
}

export async function getTheme() {
  const { theme } = await chrome.storage.sync.get({ theme: DEFAULTS.theme });
  return theme;
}

export async function setTheme(theme) {
  await chrome.storage.sync.set({ theme });
}
