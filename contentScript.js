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

function getMetaDescription() {
  const el = document.querySelector('meta[name="description"], meta[property="og:description"]');
  return el?.getAttribute("content") || "";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "EXTRACT_PAGE") {
    try {
      const selection = window.getSelection?.().toString().trim() || "";
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
