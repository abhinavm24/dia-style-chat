// lib/context.js
// Helpers for composing page context and chunking policy.

export function clamp(str, max = 4000) {
  const s = String(str || "");
  return s.length > max ? s.slice(0, max) : s;
}

export function chunkText(str, maxChars = 18000, maxChunks = 6) {
  const chunks = [];
  const s = String(str || "");
  for (let i = 0; i < s.length && chunks.length < maxChunks; i += maxChars) {
    chunks.push(s.slice(i, i + maxChars));
  }
  return chunks;
}

export function buildMetaBlock(snap) {
  const title = snap?.title || "";
  const url = snap?.url || "";
  const meta = snap?.meta ? `\nMETA: ${snap.meta}` : "";
  const sel = snap?.selection ? `\nSELECTION: ${snap.selection}` : "";
  return `TITLE: ${title}\nURL: ${url}${meta}${sel}`;
}

export function composeContext({ snapshot, includePage }) {
  if (!snapshot) return "";
  if (includePage) {
    const metaBlock = buildMetaBlock(snapshot);
    const chunks = chunkText(snapshot.text || "");
    return metaBlock + "\n" + (chunks[0] || "");
  }
  if (snapshot.selection) return `SELECTION: ${snapshot.selection}`;
  return "";
}

