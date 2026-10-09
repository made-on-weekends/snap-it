# ARCHITECTURE.md

> Technical structure. How the pieces fit together. Not how to use the project (see AGENTS.md).

## High-level diagram

```
┌────────────────────────────────────────────────────────┐
│         Chromium & Mozilla Firefox Browser Context     │
└────────────────────────────────────────────────────────┘
          │                                  │
          ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│   Extension UI   │               │ Content Scripts  │
│  popup/menu.html │               │ (area-selector)  │
│ popup/popup.html │               └──────────────────┘
│ popup/annotation │                         │
│settings/settings │                         │ runtime
└──────────────────┘                         │ messages
          │                                  │
          ▼                                  ▼
┌────────────────────────────────────────────────────────┐
│     Background Service Worker / Event Script           │
│   - chrome.tabs / chrome.scripting                     │
│   - CDP (chrome.debugger in Chrome) / Tab capture      │
│   - chrome.downloads                                   │
│   - chrome.alarms (sequential batch timers)            │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│        Storage Layer (storage-helper.js)               │
│   - chrome.storage.local (preferences & history)       │
│   - chrome.storage.session (active queue & job state)  │
└────────────────────────────────────────────────────────┘
```

## Layers

### 1. Presentation & Interaction (Popup & Studio)
- `popup/menu.html` / `popup/menu.js`: Compact quick-launch action popup with capture mode shortcuts.
- `popup/popup.html` / `popup/popup.js`: Review interface, batch URL queue runner, and canvas annotation studio embed.
- `popup/annotation.js`: Pure HTML5 Canvas rendering engine for shapes, arrows, text, spotlight, crop, and solid redaction.
- `settings/settings.html` / `settings/settings.js`: User preferences dashboard (shortcuts, format, delay, theme).

### 2. Injected Content Scripts
- `content/area-selector.js`: Injected on-demand into the active tab when Area Selection mode is triggered. Renders an interactive crosshair selection box, coordinates readout, and passes cropped coordinates back to the service worker before self-destructing.

### 3. Background Orchestrator
- `service-worker.js`: Event-driven Manifest V3 service worker.
  - Manages single-page captures via `chrome.tabs.captureVisibleTab`.
  - Coordinates full-page capture via Chrome DevTools Protocol (`chrome.debugger`) or automated scroll-and-stitch cycles.
  - Executes batch URL queues using `chrome.alarms` for delay throttling.
  - Handles file exports via `chrome.downloads`.

### 4. Storage & Persistence
- `storage-helper.js`: Abstract wrapper for Chrome storage.
  - `chrome.storage.local`: Settings, keyboard shortcuts, export configurations, and filename patterns.
  - `chrome.storage.session`: In-memory temporary state for batch capture queues and progress counters.

### 5. Design Tokens & Brand Assets
- `assets/theme.css`: Design tokens expressed as CSS custom properties with light/dark theme support.
- `assets/tokens.json`: Raw machine-readable design tokens.
- `assets/fonts/`: Bundled web fonts (Geist, Inter, Geist Mono).

## Request lifecycle: Area Capture Flow

```
1. User clicks "Select Area" in popup or presses shortcut.
2. Service worker injects `content/area-selector.js` into active tab.
3. User drags crosshair over target area; dimensions update live.
4. Selection mouseup sends `{x, y, width, height, dpr}` message to service worker.
5. Service worker captures visible tab, crops canvas to region, and saves to session storage.
6. Popup opens with cropped image loaded into `popup/annotation.js` canvas studio.
7. User annotates, then clicks "Copy" (clipboard API) or "Download" (chrome.downloads).
```

## Cross-cutting concerns

- **Permissions:** Principle of least privilege. Host permissions `<all_urls>` are used strictly to inject the area selector and capture tabs requested by the user.
- **Memory Management:** Canvas elements and bitmap buffers are actively cleared to avoid heap bloat during high-resolution multi-page captures.
- **Offline Reliability:** Zero reliance on remote servers. All code and assets are self-contained.

## Patterns we use

- **Event-Driven Service Worker:** Keep service worker stateless; restore progress from storage on alarm wakeups.
- **Pure Web APIs:** Vanilla JS Canvas, CSS variables, and DOM APIs without framework wrappers.
- **Modular Storage Facade:** Centralized schema handling in `storage-helper.js`.

## Patterns we avoid

- **No Remote Scripts or CDN Dependencies:** Strictly forbidden by Manifest V3 CSP and project privacy goals.
- **No Background Polling:** Use Chrome alarms and event listeners instead of `setInterval` in the background worker.
- **No Complex Bundlers:** Avoid Webpack, Rollup, or Vite overhead where native browser capabilities suffice.
