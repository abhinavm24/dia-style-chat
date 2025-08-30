# Tab Chat Extension

A beautiful, modern Chrome extension that provides an AI-powered chat interface for web pages.

## ✨ Features

- **Beautiful Modern UI**: Clean, gradient-based design with smooth animations
- **Brain Icon Branding**: Custom brain SVG icon representing AI intelligence

## Icon Assets

The extension uses a unified brain icon across the UI and manifest.

- Source SVG: `icons/brain.svg` (uses brand gradient to match CSS `--gradient-accent`).
- Generated PNGs: `icons/brain-16.png`, `-32`, `-48`, `-64`, `-128`, `-256`.
- Manifest is configured to use these PNGs for extension and toolbar icons.

To regenerate crisp PNGs from the SVG, run one of the following (depending on what you have installed):

Using the helper script (auto-detects tools):

```sh
./scripts/render-icons.sh
```

Manually with rsvg-convert (librsvg):

```sh
rsvg-convert -w 16 -h 16 icons/brain.svg -o icons/brain-16.png
rsvg-convert -w 32 -h 32 icons/brain.svg -o icons/brain-32.png
rsvg-convert -w 48 -h 48 icons/brain.svg -o icons/brain-48.png
rsvg-convert -w 64 -h 64 icons/brain.svg -o icons/brain-64.png
rsvg-convert -w 128 -h 128 icons/brain.svg -o icons/brain-128.png
rsvg-convert -w 256 -h 256 icons/brain.svg -o icons/brain-256.png
```

With Inkscape:

```sh
inkscape icons/brain.svg -w 16 -h 16 -o icons/brain-16.png
inkscape icons/brain.svg -w 32 -h 32 -o icons/brain-32.png
inkscape icons/brain.svg -w 48 -h 48 -o icons/brain-48.png
inkscape icons/brain.svg -w 64 -h 64 -o icons/brain-64.png
inkscape icons/brain.svg -w 128 -h 128 -o icons/brain-128.png
inkscape icons/brain.svg -w 256 -h 256 -o icons/brain-256.png
```

On macOS (Preview/sips):

```sh
sips -s format png icons/brain.svg --resampleWidth 16 --out icons/brain-16.png
sips -s format png icons/brain.svg --resampleWidth 32 --out icons/brain-32.png
sips -s format png icons/brain.svg --resampleWidth 48 --out icons/brain-48.png
sips -s format png icons/brain.svg --resampleWidth 64 --out icons/brain-64.png
sips -s format png icons/brain.svg --resampleWidth 128 --out icons/brain-128.png
sips -s format png icons/brain.svg --resampleWidth 256 --out icons/brain-256.png
```

After generating, reload the extension to see updated icons.
- **Quick Action Buttons**: Pre-defined templates for common tasks
- **Real-time Chat**: Stream responses from Gemini AI
- **Page Context**: Option to include page content in conversations
- **Responsive Design**: Works perfectly on different screen sizes
- **Smooth Animations**: Hover effects, transitions, and micro-interactions

## 🎨 Design Highlights

### Visual Design
- **Dark Theme**: Sophisticated dark color scheme with purple accents
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
- **Primary**: Deep dark blues (#0f0f23, #1a1a2e)
- **Accent**: Purple gradients (#4f46e5, #7c3aed)
- **Cards**: Subtle card backgrounds (#16213e)
- **Borders**: Refined border colors (#2d2d44)

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
- **Context Toggle**: Easy control over page content inclusion
- **Settings Access**: Quick access to extension settings
- **Smooth Scrolling**: Enhanced scrollbar with hover effects
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

---

Built with ❤️ and modern web technologies for the best user experience.
