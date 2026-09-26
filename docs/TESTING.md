# TESTING.md

> Testing strategy, verification workflows, and edge case checklist for the SnapIt Chrome extension.

## Overview

SnapIt is a vanilla browser extension without a compiler or bundling pipeline. Testing combines automated formatting/design linting with a structured manual verification matrix across Chromium browser targets.

---

## Automated Verification

```bash
# Verify design tokens and frontmatter specification
npx -y @google/design.md lint docs/DESIGN.md

# Verify .gitignore hygiene
/home/asif/.gemini/config/skills/project-ninja/scripts/gitignore-ninja.sh audit
```

---

## Manual Verification Matrix

### 1. Installation & Initialization
- [ ] Load unpacked in Google Chrome / Chromium via `chrome://extensions`.
- [ ] Verify extension icon displays crisply across 16px, 32px, 48px, and 128px densities.
- [ ] Confirm no console errors in the background service worker upon initial load.

---

### 2. Viewport & Full-Page Capture
- [ ] **Viewport Capture (`⌘ + ⇧ + 2`):** Captures exact visible area without clipping or window borders.
- [ ] **Full-Page Capture (`⌘ + ⇧ + 1`):**
  - Verify on long content-heavy documents (e.g. Wikipedia articles, technical documentation).
  - Verify on pages with sticky navigation headers and fixed floating action buttons (ensure headers are not duplicated).
  - Confirm yellow debugging banner appears only during capture and detaches immediately upon completion.
- [ ] **Restricted URLs:** Attempt capture on `chrome://extensions` or `https://chromewebstore.google.com/`. Confirm graceful error handling with an informative toast message.

---

### 3. Batch URL Queue
- [ ] Input 3+ URLs (e.g. `https://example.com [Example]`, `https://wikipedia.org [Wiki]`).
- [ ] Verify sequential processing with configured delay intervals (e.g. 2 seconds).
- [ ] Confirm progress bar updates incrementally.
- [ ] Verify each result item has a thumbnail and can be opened in the Annotation Studio.

---

### 4. Annotation Studio
- [ ] **Drawing Primitives:** Test Pen (`P`), Arrow (`A`), Rectangle (`R`), and Ellipse (`C`).
- [ ] **Mandatory Halo Rule:** Verify shape strokes show a contrasting 1.5px outline against both pure white and dark backgrounds.
- [ ] **Destructive Redaction (`B`):** Draw redaction boxes and verify underlying pixel data is completely overwritten with opaque `#14171C`.
- [ ] **History Stack:** Draw multiple elements; verify `Ctrl + Z` (undo) and `Ctrl + Y` (redo) accurately revert and restore states without subpixel distortion.
- [ ] **Zoom & Pan:** Zoom in/out and drag stage; verify annotations stay aligned with underlying image pixels.

---

### 5. Storage & File Export
- [ ] Test standard download fallback via `chrome.downloads`.
- [ ] Configure custom folder via the File System Access API in Settings; verify subsequent captures write directly to the selected directory without prompts.
- [ ] Test "Copy to Clipboard"; verify bitmap pastes cleanly into external applications (e.g. Slack, GitHub issue comment, image editor).

---

### 6. Edge Cases & Resilience
- [ ] **Memory Limits:** Capture an exceptionally tall page (>20,000px height); ensure browser does not crash and canvas does not exceed hardware limits.
- [ ] **Offline Execution:** Disconnect network connectivity; verify viewport capture and annotation studio remain 100% operational.
- [ ] **Theme Switching:** Toggle between Light and Dark themes in Settings; verify UI components and toolbar contrast adjust dynamically.
