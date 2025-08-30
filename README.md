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
- **Light + Dark Themes**: Crisp light default with rich dark variant
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

## 🌟 Future Enhancements

- [ ] Light theme option
- [ ] Custom color schemes
- [ ] Additional quick actions
- [ ] Conversation export
- [ ] Voice input support
- [ ] Multi-language support

## 📝 Changelog

2025-08-30 — UI consistency and cleanup

- Consistent rounded design: action buttons, header buttons, send button → pill; checkbox → circular.
- Page Context label always visible on small screens; removed small-screen hide rule.
- Reduced heights: tighter padding on quick actions and context toggle; send button 36px → 32px.
- Stable hover states: removed upward shift to prevent overflow/clipping.
- Layout tightening: smaller `messages-container` padding; reduced side margins on messages and welcome card, with smaller margins on very small screens.
- CSS cleanup: removed unused selectors and redundant scrollbar styles; consolidated hidden scrollbars.

---

Built with ❤️ and modern web technologies for the best user experience.
