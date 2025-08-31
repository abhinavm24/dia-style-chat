// lib/theme.js
// Theme manager for light/dark/system with media listener.

let prefersDarkMedia;
let currentTheme = 'system';
let systemThemeListener = null;

function ensureMedia() {
  if (!prefersDarkMedia && typeof window !== 'undefined') {
    prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  }
}

export function applyTheme(theme) {
  ensureMedia();
  currentTheme = theme;
  const root = document.documentElement;

  if (theme === 'system') {
    const isDark = !!prefersDarkMedia?.matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (!systemThemeListener && prefersDarkMedia) {
      systemThemeListener = (e) => {
        if (currentTheme === 'system') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
      if (prefersDarkMedia.addEventListener) {
        prefersDarkMedia.addEventListener('change', systemThemeListener);
      } else if (prefersDarkMedia.addListener) {
        prefersDarkMedia.addListener(systemThemeListener);
      }
    }
  } else {
    if (systemThemeListener && prefersDarkMedia) {
      if (prefersDarkMedia.removeEventListener) {
        prefersDarkMedia.removeEventListener('change', systemThemeListener);
      } else if (prefersDarkMedia.removeListener) {
        prefersDarkMedia.removeListener(systemThemeListener);
      }
      systemThemeListener = null;
    }
    root.setAttribute('data-theme', theme);
  }
}

export function nextTheme(current) {
  const order = ['light', 'dark', 'system'];
  const idx = order.indexOf(current);
  return order[(idx + 1 + order.length) % order.length] || 'system';
}

