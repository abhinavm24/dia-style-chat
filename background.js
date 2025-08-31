// background.js (MV3 service worker, ES module)
import { getSettings } from "./lib/settings.js";
import {
  DEFAULT_MODEL,
  toGeminiContents,
  buildUserTurn,
  callGeminiOnce,
  streamGemini,
  withBackoff,
  mapError
} from "./lib/gemini.js";
import { composeContext } from "./lib/context.js";

// Track in-flight requests per tab to abort when a new one arrives
const inflight = new Map(); // tabId -> AbortController

function abortPrevious(tabId) {
  const prev = inflight.get(tabId);
  if (prev) {
    try { prev.abort("replaced"); } catch {}
    inflight.delete(tabId);
  }
}

function withTimeout(controller, ms = 20000) {
  const t = setTimeout(() => {
    try { controller.abort("timeout"); } catch {}
  }, ms);
  return () => clearTimeout(t);
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
  } catch (e) {
    console.warn("Side panel open failed:", e);
  }
});

// Request page text from content script
async function getPageSnapshot(tabId) {
  return await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
}

// Message router for side panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "ASK_GEMINI") {
    (async () => {
      const active = await chrome.tabs.get(msg.tabId);
      const { geminiApiKey, geminiModel, enableStreaming } = await getSettings();
      if (!geminiApiKey) {
        sendResponse({ error: "Missing API key. Set it in the extension options." });
        return;
      }

      // Build context via snapshot + composition
      let ctx = "";
      try {
        const snap = await getPageSnapshot(msg.tabId);
        ctx = composeContext({ snapshot: snap, includePage: !!msg.includePage });
      } catch (e) {
        console.warn("Context extraction failed:", e);
      }

      // Compose contents (history + new user turn)
      const history = (msg.history || []).map((m) => ({ role: m.role, text: m.text }));
      const contents = toGeminiContents(history);
      contents.push(buildUserTurn(msg.question, ctx));

      try {
        // Abort any previous request for this tab
        abortPrevious(msg.tabId);
        const controller = new AbortController();
        inflight.set(msg.tabId, controller);
        const clearT = withTimeout(controller, 20000);

        const run = async () => {
          if (enableStreaming && msg.stream !== false) {
            const res = await callGeminiOnce({
              apiKey: geminiApiKey,
              model: geminiModel || DEFAULT_MODEL,
              contents,
              stream: true,
              signal: controller.signal
            });
            let aggregated = "";
            await streamGemini(res, (delta) => {
              aggregated += delta;
              chrome.tabs.sendMessage(msg.tabId, {
                type: "STREAM_DELTA",
                streamId: msg.streamId,
                delta
              });
            });
            return { text: aggregated, streamed: true };
          } else {
            const text = await callGeminiOnce({
              apiKey: geminiApiKey,
              model: geminiModel || DEFAULT_MODEL,
              contents,
              stream: false,
              signal: controller.signal
            });
            return { text, streamed: false };
          }
        };

        const isRetryable = (e) => /429|5\d\d/.test(String(e?.message || e || ""));
        let result;
        try {
          result = await withBackoff(run, { retries: 2, isRetryable });
        } catch (e) {
          // If streaming failed early, try a single non-stream fallback
          if (enableStreaming && msg.stream !== false) {
            try {
              result = await callGeminiOnce({
                apiKey: geminiApiKey,
                model: geminiModel || DEFAULT_MODEL,
                contents,
                stream: false,
                signal: controller.signal
              }).then((text) => ({ text, streamed: false }));
            } catch (e2) {
              throw e2;
            }
          } else {
            throw e;
          }
        }

        sendResponse({ ok: true, ...result });
        clearT();
        inflight.delete(msg.tabId);
      } catch (err) {
        console.error(err);
        const mapped = mapError(err);
        sendResponse({ error: mapped.message || String(err.message || err), code: mapped.code });
      }
    })();
    return true; // async
  }
});
