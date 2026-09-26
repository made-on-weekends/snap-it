# ARCHITECTURE.md

> Technical structure. How the pieces fit together. Not how to use the project (see [AGENTS.md](../AGENTS.md)).

## High-level diagram

```
┌────────────────────────────────────────────────────────┐
│                      Browser Tab                       │
│           (Target Web Page / DOM Content)              │
└───────────────────────────┬────────────────────────────┘
                            │ Chrome DevTools Protocol
                            ▼ (Page.captureScreenshot)
┌────────────────────────────────────────────────────────┐
│            Background Service Worker                   │
│               (service-worker.js)                      │
│  - CDP Debugger attachment & detachment                │
│  - Batch URL queue scheduler (chrome.alarms)           │
│  - Message passing & download dispatch                 │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    Action Menu Popup     │  │  Main Studio & Dashboard │
│    (popup/menu.html)     │  │    (popup/popup.html)    │
│  - Instant capture trigger│ │  - Batch queue controller │
│  - Mode selection        │  │  - Canvas annotation     │
│  - Studio launcher       │  │    (popup/annotation.js) │
└──────────────────────────┘  └─────────────┬────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  Storage & File Export   │
                              │   (storage-helper.js)    │
                              │  - chrome.storage.sync   │
                              │  - chrome.storage.local  │
                              │  - File System Access    │
                              └──────────────────────────┘
```

## Layers

### 1. Presentation & Interaction Layer
- **Quick Action Menu (`popup/menu.html`, `popup/menu.js`, `popup/menu.css`):** Lightweight popup for immediate viewport captures, full-page triggers, and opening the full studio.
- **Studio & Batch Dashboard (`popup/popup.html`, `popup/popup.js`, `popup/popup.css`):** Full-window dashboard for managing batch capture queues, reviewing results, and opening screenshots in the annotation canvas.
- **Options / Preferences (`settings/settings.html`, `settings/settings.js`, `settings/settings.css`):** Manages image format (PNG, JPEG, WebP), compression quality, capture delay intervals, and directory handles.

### 2. Background Orchestration Layer (`service-worker.js`)
- Runs as an event-driven Manifest V3 service worker.
- Attaches `chrome.debugger` to target tabs to communicate via Chrome DevTools Protocol (CDP).
- Executes `Page.captureScreenshot` with `captureBeyondViewport: true` for full-page renders.
- Manages sequential batch execution, tab navigation, delay countdowns via `chrome.alarms`, and status reports.
- Handles browser context menus and keyboard shortcut commands defined in `manifest.json`.

### 3. Canvas Annotation Engine (`popup/annotation.js`)
- Object-oriented canvas drawing studio (`AnnotationStudio` class).
- Features an immutable action stack for full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) operations.
- Renders vector-like annotation primitives (arrows, rectangles, ellipses, text, pens, highlighters).
- Implements the **Mandatory Halo Rule**: outlines all shape strokes with a contrasting 1.5px background outline for readability across arbitrary web ground.
- Implements **Destructive Solid Redaction**: fills sensitive areas with an opaque solid (`#14171C`), avoiding reversible blur/mosaic algorithms.

### 4. Storage & Export Layer (`storage-helper.js`)
- Persists user preferences to `chrome.storage.sync`.
- Persists active batch queues and intermediate status to `chrome.storage.local`.
- Leverages the modern **File System Access API** (`showDirectoryPicker`) to save screenshot files directly to a user-selected local folder without repeated download prompts.
- Falls back to `chrome.downloads.download` when File System Access API is unselected or unavailable.

## Request lifecycle: Full-page capture

```
1. User clicks "Capture Full Page" or hits ⌘ + ⇧ + 1
2. Action popup sends { action: 'CAPTURE_FULL_PAGE' } to service-worker.js
3. service-worker.js locates active tab:
   a. Attaches chrome.debugger to tabId ({ tabId }, '1.3')
   b. Calls CDP Page.enable and DOM.enable
   c. Queries document height via CDP Page.getLayoutMetrics
   d. Overrides device metrics if needed (Emulation.setDeviceMetricsOverride)
   e. Captures full bitmap via Page.captureScreenshot({ captureBeyondViewport: true })
   f. Clears emulation override
   g. Detaches debugger in finally block
4. Captured dataUrl returned to sender or stored in local cache
5. UI displays screenshot in Annotation Studio or initiates direct file export
```

## Patterns we use

- **Guaranteed Debugger Cleanup:** CDP debugger attachment always wraps in a `try...finally` construct to ensure `chrome.debugger.detach` is called even when a capture fails.
- **Zero-Dependency Vanilla JavaScript:** Built with native Web APIs (Canvas2D, CSS Variables, ES Modules, Promise-based Chrome APIs) for maximum performance, minimal attack surface, and instant startup time.
- **Local-First Processing:** 100% of bitmap generation, annotation rendering, and file export occurs on the local machine.

## Patterns we avoid

- **DOM Stitching / Synthetic Scrolling:** Stitched scroll captures create duplicate sticky elements, misaligned fixed headers, and choppy transitions. We use native CDP engine-level rendering instead.
- **Reversible Image Blurs:** Never use CSS blur or pixelation for sensitive data redaction. We use destructive, opaque rectangle fills.
- **Third-Party CDN Dependencies:** All fonts, icons, and scripts are strictly vendored locally inside the extension package to ensure offline functionality and CSP compliance.
