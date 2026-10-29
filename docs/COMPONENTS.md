# COMPONENTS.md

> Reusable UI component rules, interaction patterns, and module inventory.

## Component Conventions

- **Architecture:** Vanilla DOM with semantic HTML5 and vanilla JavaScript (no framework runtime).
- **Location:**
  - Toolbar & Popup: `popup/` (`popup.html`, `popup.js`, `popup.css`, `menu.html`, `menu.js`, `menu.css`)
  - Canvas Studio: `popup/annotation.js`
  - Injected Overlays: `content/area-selector.js`
  - Options & Preferences: `settings/` (`settings.html`, `settings.js`, `settings.css`)
- **Styling:** CSS variables exclusively from `assets/theme.css` (`var(--accent)`, `var(--surface)`, `var(--text)`, `var(--border)`, etc.).
- **Typography:** Geist and Inter for UI, Geist Mono for numeric/status outputs.

## Core Component Inventory

| Component / Module | Surface | Purpose | State / Storage |
|---|---|---|---|
| **Area Selector Overlay** | `content/area-selector.js` | Full-screen interactive drag-and-drop crop overlay with coordinates display. | DOM transient |
| **Annotation Studio** | `popup/annotation.js` | 2D Canvas engine with vector shapes, arrows, text callouts, numbered steps, loupe zoom, and pixelate/blur redaction. | Canvas memory buffer |
| **Quick Action Menu** | `popup/menu.js` | Compact dropdown/flyout to initiate viewport, full page, or area crop with one click. | Transient |
| **Queue Manager & Progress** | `popup/popup.js` | List of URLs with real-time status indicators (pending, capturing, completed, failed) and pause/cancel controls. | `chrome.storage.session` |
| **Settings Panel** | `settings/settings.js` | Configuration form for image format, quality, capture delay, custom directories, and themes. | `chrome.storage.local` + IndexedDB |
| **Directory Picker Button** | `settings/settings.js` | Triggers `showDirectoryPicker()`, verifies readwrite permissions, and stores handle in `storage-helper.js`. | IndexedDB (`SnapItDB`) |

## Prop & Event Patterns

- **Custom Events:** Components communicate within their window using standard DOM CustomEvents (`capture-complete`, `tool-changed`, `history-update`).
- **Cross-Boundary Messaging:** Chrome Extension Messaging API:
  - `chrome.runtime.sendMessage({ action: '...', ... })` for popup-to-service-worker requests.
  - `chrome.tabs.sendMessage(tabId, { action: '...', ... })` for service-worker-to-content-script commands.
  - `chrome.storage.onChanged` for reacting to global settings or theme changes.

## Canvas Annotation Tool Rules

1. **Non-destructive Undo/Redo:** Every stroke, shape, or annotation action pushes an immutable command object to the undo stack.
2. **Permanent Redaction:** When flattening/exporting canvas output, blur and pixelate transformations are baked directly into the pixel array; raw underlying pixels are never preserved in the exported blob.
3. **High-DPI Support:** The canvas buffer resolution automatically scales with `window.devicePixelRatio` to prevent blurriness on Retina/HiDPI screens.
