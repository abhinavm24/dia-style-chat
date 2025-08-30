# Tab Chat Extension

A beautiful, modern Chrome extension that provides an AI-powered chat interface for web pages.

## ✨ Features

- **Beautiful Modern UI**: Clean, gradient-based design with smooth animations
- **Brain Icon Branding**: Custom brain SVG icon representing AI intelligence
- **Unified Rounded Controls**: Pill-shaped buttons and circular checkbox
- **Always-Visible Page Context**: Label never hides on small screens
- **Quick Action Buttons**: Pre-defined templates for common tasks
- **Real-time Chat**: Stream responses from Gemini AI
- **Page Context**: Option to include page content in conversations
- **Responsive Design**: Works well across screen sizes
- **Smooth Animations**: Polished hover, focus, and micro-interactions

## Icon Assets

The extension uses a unified brain icon across the UI and manifest.

- Source SVG: `icons/brain.svg` (uses brand gradient to match CSS `--gradient-accent`).
- Generated PNGs: `icons/icon-16.png`, `-32`, `-48`, `-64`, `-128`, `-256`.
- Manifest is configured to use these PNGs for extension and toolbar icons.

To regenerate crisp PNGs from the SVG, use any of the following:

With rsvg-convert (librsvg):

```sh
rsvg-convert -w 16 -h 16 icons/brain.svg -o icons/icon-16.png
rsvg-convert -w 32 -h 32 icons/brain.svg -o icons/icon-32.png
rsvg-convert -w 48 -h 48 icons/brain.svg -o icons/icon-48.png
rsvg-convert -w 64 -h 64 icons/brain.svg -o icons/icon-64.png
rsvg-convert -w 128 -h 128 icons/brain.svg -o icons/icon-128.png
rsvg-convert -w 256 -h 256 icons/brain.svg -o icons/icon-256.png
```

With Inkscape:

```sh
inkscape icons/brain.svg -w 16 -h 16 -o icons/icon-16.png
inkscape icons/brain.svg -w 32 -h 32 -o icons/icon-32.png
inkscape icons/brain.svg -w 48 -h 48 -o icons/icon-48.png
inkscape icons/brain.svg -w 64 -h 64 -o icons/icon-64.png
inkscape icons/brain.svg -w 128 -h 128 -o icons/icon-128.png
inkscape icons/brain.svg -w 256 -h 256 -o icons/icon-256.png
```

On macOS (Preview/sips):

```sh
sips -s format png icons/brain.svg --resampleWidth 16 --out icons/icon-16.png
sips -s format png icons/brain.svg --resampleWidth 32 --out icons/icon-32.png
sips -s format png icons/brain.svg --resampleWidth 48 --out icons/icon-48.png
sips -s format png icons/brain.svg --resampleWidth 64 --out icons/icon-64.png
sips -s format png icons/brain.svg --resampleWidth 128 --out icons/icon-128.png
sips -s format png icons/brain.svg --resampleWidth 256 --out icons/icon-256.png
```

After generating, reload the extension to see updated icons.

## 🎨 Design Highlights

### Visual Design
- **Themes: Light, Dark, System**: Defaults to System (auto). Respects OS `prefers-color-scheme` and updates live.
- **Gradients**: Beautiful gradient backgrounds and buttons
- **Glassmorphism**: Subtle backdrop blur effects
- **Shadows**: Layered shadow system for depth
- **Typography**: Clean, readable fonts with proper hierarchy

### Interactive Elements
- **Hover Effects**: Smooth hover animations on all interactive elements
- **Focus States**: Clear focus indicators for accessibility
- **Loading States**: Animated typing indicators
- **Smooth Transitions**: 0.2s transitions for all interactive elements

### Color Palette
- **Light**: Whites and slate text (e.g., #ffffff, #0f172a, #64748b)
- **Dark**: Deep dark blues (#0f0f23, #1a1a2e)
- **Accent**: Blues/purples (#3b82f6, #7c3aed)
- **Cards/Borders**: Subtle cards and refined borders

## 🚀 Quick Actions

The extension includes five quick action buttons:
1. **Summary** - Get a concise summary of the current page
2. **Rewrite** - Rewrite selected text to improve clarity
3. **Explain** - Step-by-step explanation of selected text
4. **Pros/Cons** - List advantages and disadvantages from the page
5. **Translate** - Translate selected text to English

## 🛠️ Technical Features

- **Chrome Extension API**: Built with modern Chrome extension APIs
- **Gemini AI Integration**: Powered by Google's Gemini AI model
- **Streaming Responses**: Real-time streaming of AI responses
- **Message History**: Maintains conversation context
- **Error Handling**: Graceful error handling with user feedback

## 📱 Responsive Design

- **Desktop**: Full-featured interface with all elements visible
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Single-column layout for small screens
- **Touch Friendly**: Optimized for touch interactions

## 🎯 User Experience

- **Welcome Message**: Friendly onboarding experience
- **Theme Toggle**: Header toggle cycles Light → Dark → System; System mirrors OS and switches automatically when your OS theme changes.
- **Context Toggle**: Easy control over page content inclusion (label always visible)
- **Settings Access**: Quick access to extension settings
- **Clean Scrolling**: Hidden scrollbars; smooth trackpad/touch scrolling
- **Keyboard Navigation**: Full keyboard support

## 🔧 Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. Add your Gemini API key in the extension options

## 🎨 Customization

The extension uses CSS custom properties for easy theming:
- Modify colors in the `:root` section of `sidepanel.css`
- Adjust animations by changing transition durations
- Customize gradients and shadows as needed
- Theme preference is stored in `chrome.storage.sync` as `theme` with values `light`, `dark`, or `system` (default).

## 🌟 Future Enhancements

- [ ] Theme selector UI in Settings (optional; toggle already cycles modes)
- [ ] Custom color schemes
- [ ] Additional quick actions
- [ ] Conversation export
- [ ] Voice input support
- [ ] Multi-language support

## 📝 Changelog

2025-08-31 — System theme and toggle cycle

- Added System theme that follows OS preference via `prefers-color-scheme`.
- Theme toggle cycles Light → Dark → System with contextual icons.

2025-08-30 — UI consistency and cleanup

- Consistent rounded design: action buttons, header buttons, send button → pill; checkbox → circular.
- Page Context label always visible on small screens; removed small-screen hide rule.
- Reduced heights: tighter padding on quick actions and context toggle; send button 36px → 32px.
- Stable hover states: removed upward shift to prevent overflow/clipping.
- Layout tightening: smaller `messages-container` padding; reduced side margins on messages and welcome card, with smaller margins on very small screens.
- CSS cleanup: removed unused selectors and redundant scrollbar styles; consolidated hidden scrollbars.

---

Built with ❤️ and modern web technologies for the best user experience.

## Build & Release

This repo includes a minimal, dependency-free build setup to produce Chrome and Firefox-ready bundles and zip them for release.

- Requirements: Node 18+ (Node 20 recommended) and the `zip` CLI in PATH.

### Commands

- `npm run clean` — remove `dist/` and `release/`.
- `npm run version` — sync `manifest.json` version from `package.json`.
- `npm run preflight` — validate manifest, files, icons, and permissions.
- `npm run build` — build Chrome and Firefox bundles into `dist/`.
- `npm run build:chrome` — build only Chrome.
- `npm run build:firefox` — build only Firefox (manifest adapted, code unchanged).
- `npm run package` — create zips in `release/` with versioned names.
- `npm run release` — build + package in one go.
- `npm run verify` — clean, build, package, and run basic artifact checks.

Artifacts:
- `dist/chrome` and `release/TabChat-<version>-chrome.zip` for Chrome.
- `dist/firefox` and `release/TabChat-<version>-firefox.zip` as a Firefox-ready bundle (sidebar manifest). Further polyfills may be needed before publishing to AMO.

### Chrome Web Store Upload (optional)

You can upload and publish to the Chrome Web Store via the included script. Provide these environment variables (locally or as GitHub Secrets):

- `CWS_EXTENSION_ID` — your extension ID
- `CWS_CLIENT_ID` — OAuth client ID
- `CWS_CLIENT_SECRET` — OAuth client secret
- `CWS_REFRESH_TOKEN` — OAuth refresh token
- `CWS_CHANNEL` — optional (default is `default`; can use `trustedTesters`)

Run: `npm run cws:upload`

### GitHub Actions

On tag push (e.g., `v1.0.1`), the workflow builds, packages, attaches zips to a GitHub Release, and, if CWS secrets are present, uploads to Chrome Web Store.

### Firefox Readiness

The build converts the manifest for Firefox by:
- Replacing `side_panel` with `sidebar_action`.
- Removing the `sidePanel` permission.
- Adding `browser_specific_settings.gecko` with a placeholder ID.

To customize, set environment variables when building:
- `GECKO_ID` (default `tab-chat@example.com`)
- `GECKO_MIN_VERSION` (default `109.0`)

Note: The code currently uses `chrome.*` APIs. For broader Firefox compatibility later, consider adding `webextension-polyfill` and switching to `browser.*` or a thin compatibility wrapper.

### Environment

- Use Node 20 (`.nvmrc` included). On CI, `actions/setup-node@v4` pins Node.
- Copy `.env.example` to `.env` (optional) and export vars when running `cws:upload` locally.
