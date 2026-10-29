# ARCHITECTURE.md

> Technical structure. How the pieces fit together. Not how to use the project (see [AGENTS.md](../AGENTS.md)).

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser UI Surfaces                      │
│                                                             │
│   ┌──────────────────────┐      ┌───────────────────────┐   │
│   │   Extension Popup    │      │    Settings Page      │   │
│   │   (popup/index.html) │      │ (settings/index.html) │   │
│   └──────────┬───────────┘      └───────────┬───────────┘   │
└──────────────┼──────────────────────────────┼───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Service Worker                      │
│                (service-worker.js)                          │
│                                                             │
│   • Message router & job queue manager                      │
│   • Chrome DevTools Protocol (CDP) session manager          │
│   • Batch URL scheduler via chrome.alarms                   │
│   • Capture engine dispatcher                               │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│  Target Tab & DOM Layer   │  │   Persistence & Storage      │
│                           │  │                              │
│ • Content scripts         │  │ • chrome.storage.local       │
│ • Selection crop overlay  │  │ • chrome.storage.session     │
│ • Scroll height metrics   │  │ • storage-helper.js          │
│ • CDP Page.captureScreenshot │ • IndexedDB (SnapItDB)       │
│                           │  │ • File System Access API     │
└───────────────────────────┘  └──────────────────────────────┘
```

## Layers

### 1. Presentation Layer (UI Surfaces)
- **Popup (`popup/`):** Trigger quick captures (viewport, full page, crop area), manage batch URL queues, and launch the annotation studio.
- **Settings (`settings/`):** Configure default output format (PNG/JPEG), compression quality, capture delay, custom download folders, and appearance (light/dark/system).
- **Styles:** Shared design system driven by `assets/theme.css` and `assets/tokens.json`.

### 2. Service Worker (`service-worker.js`)
- Runs as the MV3 background coordinator.
- Manages sequential queue execution for batch jobs without blocking the main browser thread.
- Orchestrates `chrome.debugger` commands (`Page.enable`, `Emulation.setDeviceMetricsOverride`, `Page.captureScreenshot`).
- Enforces foolproof debugger detach logic to prevent lingering debug banners.

### 3. Content Script & Overlay Layer (`content/`)
- Injected on-demand into the active tab when initiating area crops or measuring scroll heights.
- Handles user mouse drag interactions to calculate normalized pixel coordinates for cropping.
- Communicates back to the service worker via `chrome.runtime.sendMessage`.

### 4. Storage & Persistence (`storage-helper.js`)
- **IndexedDB (`SnapItDB`):**
  - Store `handles`: Stores serialized `FileSystemDirectoryHandle` objects obtained from `window.showDirectoryPicker()`.
  - Store `screenshots`: Caches captured image data URLs, timestamps, and job metadata.
- **Chrome Storage API:**
  - `chrome.storage.local`: Global user preferences and settings.
  - `chrome.storage.session`: In-memory capture queue progress and ephemeral job states.

## Request Lifecycle (Capture Workflow)

```
1. User clicks "Full Page Capture" in Popup
   │
2. Popup sends { action: 'captureFullPage', tabId } to service-worker.js
   │
3. Service Worker attaches debugger: chrome.debugger.attach({ tabId }, '1.3')
   │
4. CDP retrieves layout metrics: Page.getLayoutMetrics
   │
5. CDP executes: Page.captureScreenshot({ format, quality, captureBeyondViewport: true })
   │
6. Debugger detaches: chrome.debugger.detach({ tabId })
   │
7. Screenshot data URI returned to Popup or dispatched to storage-helper.js
   │
8. Image saved directly to disk (Downloads API or FileSystemHandle)
```

## Cross-Browser Strategy

- **Chromium (Chrome, Edge, Brave):** Uses Manifest V3 with background service worker (`service-worker.js`), `chrome.debugger` API, and File System Access API.
- **Firefox:** Uses `manifest.firefox.json` with compatible background configurations, avoiding unsupported Chromium-only debugger commands and gracefully falling back to scrolling canvas stitches or visible tab captures.
- **Manifest Pipeline:** Single source `manifest.json` processed by `scripts/generate-manifests.js`.
