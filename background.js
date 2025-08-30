// background.js (MV3 service worker)

const DEFAULT_MODEL = "gemini-2.5-flash-lite"; // Slim for lower latency, change in options if desired.

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
  } catch (e) {
    console.warn("Side panel open failed:", e);
  }
});

// Helper: read options (apiKey, model, streaming)
async function readSettings() {
  const { geminiApiKey, geminiModel, enableStreaming } = await chrome.storage.sync.get({
    geminiApiKey: "",
    geminiModel: DEFAULT_MODEL,
    enableStreaming: false
  });
  return { geminiApiKey, geminiModel, enableStreaming };
}

// Request page text from content script
async function getPageSnapshot(tabId) {
  return await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" });
}

// Convert our simple chat array into Gemini "contents"
function toGeminiContents(history) {
  // history: [{role: 'user'|'model', text: '...'}]
  return history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
}

// Build a single user turn that includes question + context chunk
function buildUserTurn(question, ctxChunk) {
  const header =
    "You are an assistant embedded in a browser side panel. " +
    "Use only the provided PAGE content (and selection when present) to answer precisely. " +
    "Quote and cite with short snippets when helpful. If info is not in PAGE, say so succinctly.";
  const pagePrefix = ctxChunk
    ? `\n\nPAGE CONTEXT BEGIN\n${ctxChunk}\nPAGE CONTEXT END\n`
    : "";
  return {
    role: "user",
    parts: [{ text: `${header}\n\nUSER QUESTION:\n${question}${pagePrefix}` }]
  };
}

// Chunk long text to keep requests manageable
function chunkText(str, maxChars = 18000) {
  const chunks = [];
  for (let i = 0; i < str.length; i += maxChars) {
    chunks.push(str.slice(i, i + maxChars));
    if (chunks.length >= 6) break; // cap total context (~108k chars)
  }
  return chunks;
}

async function callGeminiOnce({ apiKey, model, contents, stream = true, signal }) {
  if (stream) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
      }),
      signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini streaming error: ${res.status} ${res.statusText}\n${text}`);
    }
    return res; // caller will parse SSE
  } else {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
      }),
      signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini error: ${res.status} ${res.statusText}\n${text}`);
    }
    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("");
  }
}

// Stream parser for SSE from :streamGenerateContent
async function streamGemini(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!chunk) continue;
      // SSE lines usually "data: {...}"
      const lines = chunk.split("\n").map((l) => l.replace(/^data:\s?/, "").trim());
      const payload = lines.join("");
      try {
        const obj = JSON.parse(payload);
        const parts = obj?.candidates?.[0]?.content?.parts || [];
        const text = parts.map((p) => p.text || "").join("");
        if (text) onDelta(text);
      } catch {
        // ignore keepalives / non-JSON
      }
    }
  }
}

// Message router for side panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "ASK_GEMINI") {
    (async () => {
      const active = await chrome.tabs.get(msg.tabId);
      const { geminiApiKey, geminiModel, enableStreaming } = await readSettings();
      if (!geminiApiKey) {
        sendResponse({ error: "Missing API key. Set it in the extension options." });
        return;
      }

      // Build context: always include selection if present; include full page only if opted in
      let ctx = "";
      try {
        const snap = await getPageSnapshot(msg.tabId);

        if (msg.includePage) {
          const metaBlock =
            `TITLE: ${snap.title}\nURL: ${snap.url}\n` +
            (snap.meta ? `META: ${snap.meta}\n` : "") +
            (snap.selection ? `SELECTION: ${snap.selection}\n` : "");
          const chunks = chunkText(snap.text || "");
          ctx = metaBlock + (chunks[0] || "");
        } else if (snap.selection) {
          // When page context is disabled, still pass selected text so quick actions work
          ctx = `SELECTION: ${snap.selection}`;
        }
      } catch (e) {
        console.warn("Context extraction failed:", e);
      }

      // Compose contents (history + new user turn)
      const history = (msg.history || []).map((m) => ({ role: m.role, text: m.text }));
      const contents = toGeminiContents(history);
      contents.push(buildUserTurn(msg.question, ctx));

      try {
        if (enableStreaming && msg.stream !== false) {
          const controller = new AbortController();
          const res = await callGeminiOnce({
            apiKey: geminiApiKey,
            model: geminiModel || DEFAULT_MODEL,
            contents,
            stream: true,
            signal: controller.signal
          });
          // stream back via chunks; we aggregate and return final at end
          let aggregated = "";
          await streamGemini(res, (delta) => {
            aggregated += delta;
            chrome.tabs.sendMessage(msg.tabId, {
              type: "STREAM_DELTA",
              streamId: msg.streamId,
              delta
            });
          });
          sendResponse({ ok: true, text: aggregated, streamed: true });
        } else {
          const text = await callGeminiOnce({
            apiKey: geminiApiKey,
            model: geminiModel || DEFAULT_MODEL,
            contents,
            stream: false
          });
          sendResponse({ ok: true, text, streamed: false });
        }
      } catch (err) {
        console.error(err);
        sendResponse({ error: String(err.message || err) });
      }
    })();
    return true; // async
  }
});
