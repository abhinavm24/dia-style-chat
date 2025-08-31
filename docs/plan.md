# Tab Chat – Roadmap

A prioritized, actionable plan to evolve the extension.

## Product Readiness
- Persist chat history per tab/origin with clear history control.
- Export conversation (Markdown/JSON) and copy last answer.
- Keyboard improvements and shortcut to open the panel.

## UX & Rendering
- Render messages with safe markdown (bold/italic/code) and add copy-code.
- Per-message actions: Regenerate and Follow-up.
- Clear, actionable error states with retry.

## Context & Quality
- Remember page-context preference per site.
- Include URL/title consistently; slider for max context.
- Smarter chunking to send multiple page chunks when needed.

## Settings
- Model picker with popular Gemini models and descriptions.
- Validate API key/model on save.
- Themes: Light, Dark, and System (auto) with live changes.

## Cross-Browser
- Add a thin `browser` shim or polyfill for Firefox.
- Ensure `sidebar_action` bundle works and document any caveats.

## Voice & Languages
- Optional voice input via Web Speech API.
- Prepare i18n scaffolding for UI strings.

## Automation & Release
- Expand verify step for Firefox manifest assertions.
- Maintain one-click build/package and store upload guidance.

