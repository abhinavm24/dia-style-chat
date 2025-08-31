// lib/msg.js
// Lightweight wrappers around runtime messaging with timeouts and typed events.

export class TimeoutError extends Error {
  constructor(message = "Timed out") {
    super(message);
    this.name = "TimeoutError";
    this.code = "TIMEOUT";
  }
}

export function sendMessage(type, payload = {}, { timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new TimeoutError());
      }
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage({ type, ...payload }, (resp) => {
        if (done) return;
        clearTimeout(timer);
        const err = chrome.runtime.lastError;
        if (err) return reject(new Error(err.message || String(err)));
        resolve(resp);
      });
    } catch (e) {
      if (done) return;
      clearTimeout(timer);
      reject(e);
    }
  });
}

// Add and remove listeners for a specific message type.
export function addListener(type, handler) {
  const wrapped = (msg, sender, sendResponse) => {
    if (msg && msg.type === type) return handler(msg, sender, sendResponse);
  };
  chrome.runtime.onMessage.addListener(wrapped);
  return () => chrome.runtime.onMessage.removeListener(wrapped);
}

