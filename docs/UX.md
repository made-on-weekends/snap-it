# UX.md

> User flows, interaction states, and behavioral rules.

## Core Flows

### 1. Instant Viewport Capture
1. User clicks the extension toolbar icon or keyboard shortcut (`Alt+Shift+V`).
2. Immediate flash indicator or subtle scrim acknowledges capture.
3. The image is captured in background (`<200ms`) and opened in the Annotation Studio or saved directly to downloads per user preferences.

### 2. Full-Page CDP Capture
1. User selects "Full Page Capture".
2. Popup displays loading progress spinner ("Calculating page metrics...").
3. Service worker attaches Chrome DevTools Protocol (`chrome.debugger`), calculates complete scrollable bounding box, and calls `Page.captureScreenshot` with `captureBeyondViewport: true`.
4. Debugger detaches cleanly.
5. Screenshot loads in editor or triggers download.

### 3. Interactive Crop Selection
1. User selects "Capture Area".
2. Extension popup closes; `content/area-selector.js` activates across active tab.
3. Screen dims with a neutral graphite scrim (no color tinting).
4. Crosshair cursor guides user drag. Coordinate and dimension badge updates in real time.
5. On mouse release:
   - "Save", "Edit", and "Cancel" floating action pill appears.
   - User confirms: viewport is cropped, overlay removed, and image delivered.

### 4. Bulk URL Queue Processing
1. User pastes a list of URLs (one per line) into the Queue tab.
2. Queue displays total count, estimated time based on delay settings, and a prominent "Start Batch" button.
3. During processing:
   - Linear progress bar indicates completion percentage (`N / Total`).
   - Active URL highlights with a spinning status badge.
   - User can click "Pause" or "Stop" at any time. State is retained in `chrome.storage.session`.

## Behavior Rules (Always / Never)

**Always:**
- **Always** provide immediate visual feedback (<100ms) upon user trigger (spinner, scrim, or button state).
- **Always** detach debugger on every exit path to prevent lingering Chrome debugging banners.
- **Always** preserve unsaved canvas annotations if user accidentally minimizes or switches tabs in the editor.
- **Always** keep capture scrims neutral graphite at fixed alpha — never tint active web pages.

**Never:**
- **Never** silently fail on CDP attachment error — show an actionable notification (e.g. "Cannot capture chrome:// or restricted system tabs").
- **Never** block the active browser window with modal `alert()` or `confirm()` dialogs.
- **Never** destroy canvas history on minor tool switching.

## Undo & Redo Policy

- **Annotation Canvas:** Supports full multi-level undo/redo via `Ctrl+Z` / `Ctrl+Y` (`Cmd+Z` / `Cmd+Shift+Z` on macOS).
- **Batch Queue:** Canceling a running batch stops pending URLs immediately, but keeps already-captured files safe on disk.
