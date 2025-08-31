// lib/gemini.js
// Gemini client: content builders, stream/non-stream calls, SSE parsing, and error mapping.

export const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export function toGeminiContents(history) {
  return (history || []).map((m) => ({ role: m.role, parts: [{ text: m.text || "" }] }));
}

export function buildUserTurn(question, ctxChunk = "") {
  const header =
    "You are an assistant embedded in a browser side panel. " +
    "Use only the provided PAGE content (and selection when present) to answer precisely. " +
    "Quote and cite with short snippets when helpful. If info is not in PAGE, say so succinctly.";
  const pagePrefix = ctxChunk ? `\n\nPAGE CONTEXT BEGIN\n${ctxChunk}\nPAGE CONTEXT END\n` : "";
  return { role: "user", parts: [{ text: `${header}\n\nUSER QUESTION:\n${question}${pagePrefix}` }] };
}

export function chunkText(str, maxChars = 18000, maxChunks = 6) {
  const chunks = [];
  const s = String(str || "");
  for (let i = 0; i < s.length && chunks.length < maxChunks; i += maxChars) {
    chunks.push(s.slice(i, i + maxChars));
  }
  return chunks;
}

export function mapError(e) {
  const msg = String(e?.message || e || "");
  if (/401|403/.test(msg)) return { code: "MISSING_KEY", message: "Missing or invalid API key" };
  if (/429/.test(msg)) return { code: "RATE_LIMIT", message: "Rate limited. Please retry shortly." };
  if (/5\d\d/.test(msg)) return { code: "SERVER", message: "Server error. Please retry." };
  if (/timeout/i.test(msg)) return { code: "TIMEOUT", message: "Request timed out." };
  return { code: "NETWORK", message: msg || "Network error" };
}

export async function callGeminiOnce({ apiKey, model, contents, stream = true, signal }) {
  if (stream) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 } }),
      signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini streaming error: ${res.status} ${res.statusText}\n${text}`);
    }
    return res;
  } else {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 } }),
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

export async function streamGemini(res, onDelta) {
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

export async function withBackoff(fn, { retries = 2, isRetryable } = {}) {
  let attempt = 0;
  let delay = 250;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries || (isRetryable && !isRetryable(e))) throw e;
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      delay *= 2;
    }
  }
}

