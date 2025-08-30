// contentScript.js
function extractPrimaryText() {
  // Prefer <main> or <article>, fallback to body
  const pick = document.querySelector("main, article") || document.body;
  // Drop scripts/styles/nav/aside
  const clone = pick.cloneNode(true);
  clone.querySelectorAll("script, style, nav, header, footer, aside, noscript").forEach((n) => n.remove());
  // Remove hidden
  clone.querySelectorAll("*").forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style && (style.display === "none" || style.visibility === "hidden")) el.remove();
  });
  const text = clone.innerText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

function getSelectedText() {
  try {
    // Handle selections inside input/textarea
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /^(text|search|url|tel|password|email|number)$/i.test(ae.type)))) {
      const start = ae.selectionStart ?? 0;
      const end = ae.selectionEnd ?? 0;
      if (typeof start === 'number' && typeof end === 'number' && end > start) {
        return String(ae.value).slice(start, end).trim();
      }
    }
    // Default DOM selection (works for contentEditable and page text)
    const sel = window.getSelection?.();
    const s = sel && typeof sel.toString === 'function' ? sel.toString() : '';
    return (s || '').trim();
  } catch {
    return '';
  }
}

function getMetaDescription() {
  const el = document.querySelector('meta[name="description"], meta[property="og:description"]');
  return el?.getAttribute("content") || "";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "EXTRACT_PAGE") {
    try {
      const selection = getSelectedText();
      const text = extractPrimaryText();
      sendResponse({
        title: document.title || "",
        url: location.href,
        meta: getMetaDescription(),
        selection,
        text
      });
    } catch (e) {
      sendResponse({ title: document.title || "", url: location.href, meta: "", selection: "", text: "" });
    }
  }
  return true;
});
