// options.js
const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");
const streamEl = document.getElementById("stream");
const saveBtn = document.getElementById("save");

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
  saveBtn.textContent = "Saved ✓";
  setTimeout(() => (saveBtn.textContent = "Save"), 1200);
}
saveBtn.addEventListener("click", save);
load();
