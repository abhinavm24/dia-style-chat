# Tab Chat — Simple Plan

Goals
- Simplify core code paths, improve reliability, and keep the polished UI.
- Make failures graceful with clear recovery and minimal dependencies.

Core Steps
1) Utilities extraction
   - settings.js: read/write with sane defaults (apiKey, model, streaming, theme).
   - msg.js: safe `sendMessage` with timeouts and typed events.
   - gemini.js: single client for stream/non‑stream + abort + backoff.
   - context.js: page snapshot + chunking policy.
   - theme.js: light/dark/system with media listener attach/detach.

2) Abort, timeout, backoff
   - Abort in‑flight when a new prompt is sent.
   - 20s request timeout (configurable).
   - Exponential backoff for 429/5xx (250ms → 500ms → 1s).

3) Unified error surface
   - Map to codes: MISSING_KEY, BAD_MODEL, NETWORK, RATE_LIMIT, TIMEOUT.
   - Show banner with Retry / Open Settings in the side panel.

4) Streaming fallback
   - If SSE parse fails or stalls, retry once with non‑stream path.

5) Prompt hygiene
   - Trim whitespace; clamp prompt to 4k chars.
   - If quick action without selection, generate a minimal, valid prompt.

6) History persistence
   - Persist per origin + tabId; cap to last 20 turns or 64KB.
   - Provide Clear for tab/origin and Export (JSON/MD).

7) Safe rendering
   - Escape‑first markdown: bold, italic, inline code, fenced code blocks.
   - Add Copy for message and Copy code for blocks.

8) Stream performance
   - Batch DOM updates during streaming via requestAnimationFrame.

9) Cross‑browser readiness
   - Thin `browser` shim over `chrome` APIs; keep current manifest transform.

10) Build and checks
   - Preflight ensures defaults, files, icons, and permissions.
   - Verify lists zip contents and checks size caps.

Checklists
- [x] Utilities extracted (settings/msg/gemini/context/theme)
- [x] Abort + timeout + backoff wired (background)
- [x] Non‑stream fallback on SSE failure (background)
- [x] Prompt trimming + clamping (panel)
- [x] Error banners + actions implemented (panel)
- [x] History persisted with caps + clear/export
- [x] Safe markdown + copy actions
- [x] Stream rAF batching
- [x] Browser shim verified in Firefox build
- [x] Preflight/verify passing

Rollout
- Phase A: 1–4 (foundations + resilience)
- Phase B: 5–7 (UX safety + persistence)
- Phase C: 8–10 (perf, cross‑browser, release polish)

Progress Notes
- Phase A utilities scaffolded under `lib/` and wired in background.
- background.js: per‑tab abort, 20s timeout, 429/5xx backoff, non‑stream fallback.
- sidepanel.js: prompt clamping, actionable error banners with Retry/Settings, safe markdown, copy actions, rAF stream batching, per‑origin history with caps + export/clear.

Troubleshooting
- No response: check API key in Settings, network; retry non‑stream.
- Stuck busy: new prompt cancels previous; reload side panel if needed.
- Large page: disable page context or raise context slider once added.
