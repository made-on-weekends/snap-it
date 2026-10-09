# UX.md

> User flows and behavior rules. The "what happens when" doc.
> Visual rules in `docs/DESIGN.md`. Component-level rules in `docs/COMPONENTS.md`.

## Core flows

### 1. Viewport Capture Flow
1. User clicks the SnapIt extension icon in the toolbar or presses `Alt + S` / `Option + S`.
2. Extension popup displays the three capture options with keyboard shortcuts.
3. User selects "Capture visible tab".
4. Background service worker takes instant capture via `chrome.tabs.captureVisibleTab`.
5. Review editor opens in popup with the captured frame.
6. User clicks "Copy" (copies bitmap to clipboard) or "Download" (triggers download).
7. Floating toast confirms action: `"Copied"` or `"Saved to Downloads"`.

### 2. Area Selection Flow
1. User selects "Capture region" (or shortcut).
2. Service worker injects `content/area-selector.js`.
3. Screen displays a neutral graphite scrim overlay (`rgba(12,14,18,0.50)` light, `rgba(6,7,9,0.62)` dark) that **never tints the underlying page**.
4. Cursor switches to crosshair with live coordinate and dimension readout in Geist Mono (`1280 × 720`).
5. User drags a rectangle over the desired page elements (minimum 4 × 4px).
6. Floating dimension badge flips inside selection if dragged to the top viewport edge.
7. Releasing the mouse triggers the capture pipeline, passing cropped coordinates to the service worker and removing overlay elements immediately.

### 3. Full-Page Scrolling Capture Flow
1. User selects "Capture full page".
2. Service worker initiates automated scrolling loop / CDP session.
3. Progress status indicator appears in the popup row.
4. If page exceeds 16,384px in height, capture truncates gracefully with status notification:
   `"Page is taller than 16384px. Capturing the first 16384px."`
5. Canvas stiches the full height bitmap and opens in the editor.

### 4. Bulk URL Queue Flow
1. User navigates to Bulk Queue tab.
2. User enters or pastes multiple target URLs with a configurable delay timer (default: 15s).
3. Service worker sequentially opens each URL in a background tab, waits for load, takes screenshot, downloads with timestamped filename, and closes the tab.
4. Live progress counter updates in session storage.

## Behavior rules

**Always:**
- Always show clear feedback when an action fails with instructions on what to do next.
- Always preserve captured bitmap in canvas memory until explicitly discarded or new capture started.
- Always provide immediate dismissal via `Esc` key on the area selection overlay.
- Always enforce solid ink fill for redactions—never use blur as a privacy affordance.
- Always render shortcuts as keycaps (`⌘ ⇧ 4`, `Alt + S`) rather than descriptive prose.

**Never:**
- Never tint the underlying web page with colored washes during selection scrims.
- Never use exclamation marks in any user-facing notifications or toast copy.
- Never use "Oops!" or "Error:" prefixes in error handling messages.
- Never send screenshot data over the network or external APIs.

## Toast & feedback copy

Use exact copy strings without terminal punctuation:
- `"Copied"`
- `"Saved to Downloads"`
- `"Copied · 1280 × 720"`

## State & error messages

- **Restricted page:** `"Chrome doesn't allow captures on this page. Try another tab."`
- **Capture failed:** `"Capture failed. Reload the page and try again."`
- **Clipboard blocked:** `"Couldn't copy. Download instead?"`
- **Download blocked:** `"Downloads are blocked for this site. Copy instead?"`
- **Selection too small:** `"Drag a larger area — at least 4 × 4"`
