# TESTING.md

> Verification procedures, manual testing checklist, and extension testing strategy.
> Commands are owned by `AGENTS.md`; strategy and test expectations are owned here.

## Strategy

SnapIt is a pure, zero-build Chrome extension built on Chromium platform APIs (`chrome.tabs`, `chrome.debugger`, `chrome.downloads`, HTML5 Canvas). Testing emphasizes automated runtime validation and structured end-to-end manual verification in Chrome.

## Manual verification checklist

Run this checklist before submitting releases or updating core pipelines:

### 1. Extension Loading & Manifest Integrity
- [ ] Open `chrome://extensions` in developer mode.
- [ ] Click **Load unpacked** and select the `dist/chrome` directory (after running `./scripts/build-chrome.sh`).
- [ ] Confirm no yellow warning badges or manifest syntax errors appear.
- [ ] Click the **service worker** inspect link and verify the background console has 0 errors.

### 2. Viewport Capture Test
- [ ] Open a complex web page (e.g. GitHub or Wikipedia).
- [ ] Trigger "Capture visible tab" via the popup menu or shortcut.
- [ ] Verify review editor displays the full viewport accurately at native device pixel ratio.
- [ ] Verify "Copy" copies image to clipboard and displays `"Copied"` toast.

### 3. Area Selection Test
- [ ] Trigger "Capture region".
- [ ] Verify neutral graphite scrim displays over the active page without color tinting.
- [ ] Verify crosshair cursor and live dimension readout in Geist Mono (`1280 × 720`).
- [ ] Drag an area smaller than 4 × 4px; verify minimum bounds warning.
- [ ] Drag a valid area; verify smooth crop and instant transition to review studio.

### 4. Full-Page Scrolling Capture Test
- [ ] Navigate to a long article or documentation page (> 5,000px height).
- [ ] Trigger "Capture full page".
- [ ] Verify page scrolls automatically and stitches without seam lines, overlapping headers, or blank tiles.
- [ ] Test on a page exceeding 16,384px; verify graceful truncation warning.

### 5. Canvas Annotation Studio Test
- [ ] Draw shapes (rectangle, arrow, line, freehand).
- [ ] Verify shapes render sharp lines with 1px halo rings for contrast.
- [ ] Apply **Redact** tool; verify it creates a 100% solid opaque ink rectangle (never blurred).
- [ ] Add text annotation; verify crisp typography in Inter.
- [ ] Test undo/redo and color swatch switches.

### 6. Export & Storage Test
- [ ] Test PNG export; verify transparency preserved if applicable.
- [ ] Test JPEG and WebP export with quality slider adjustments in `settings/settings.html`.
- [ ] Verify files download to configured subfolder with custom naming pattern.

### 7. Bulk URL Queue Test
- [ ] Enter 3 distinct URLs in the bulk queue with a 5-second delay.
- [ ] Start queue; verify sequential tab creation, capture, download, and tab closure.
- [ ] Verify no orphaned background tabs remain after batch completes.
