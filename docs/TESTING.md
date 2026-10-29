# TESTING.md

> Testing strategy, cross-browser validation, and quality verification.

## Testing Strategy

Because SnapIt is a zero-runtime-dependency browser extension interacting deeply with browser internals (`chrome.debugger`, `chrome.tabs`, `chrome.storage`, IndexedDB, and HTML5 Canvas), testing spans three tiers:

1. **Manifest & Packaging Integrity (Automated):**
   - Manifest schema and syntax verification across Chromium MV3 and Firefox MV2/MV3.
   - `web-ext lint` for Firefox add-on policy validation.
2. **Interactive Manual Testing (Developer / QA):**
   - Verification across Chromium (Google Chrome, Brave, Microsoft Edge) and Mozilla Firefox.
   - HiDPI/Retina display scale factor tests.
   - Sticky header & dynamic virtual-scrolling DOM full-page capture tests.
3. **Canvas Engine Regression Tests:**
   - Vector drawing mathematical calculations (arrow heads, bezier arcs, step numbering).
   - Pixelate and blur irreversible redaction verification.

## Commands

```bash
# Verify and regenerate browser-specific manifests
npm run manifests

# Package extensions for Chrome and Firefox
npm run build

# Lint Firefox extension bundle for store compliance
npm run lint:firefox
```

## What to Test

**Do Test:**
- **Debugger Detach Reliability:** Verify that closing the target tab or navigating during a full-page capture detaches `chrome.debugger` without leaving orphan debugging states.
- **Permission Boundaries:** Confirm that attempts to capture restricted URLs (`chrome://*`, `about:*`, `edge://*`, Chrome Web Store) produce friendly error messages instead of unhandled exceptions.
- **Canvas Redaction Permanence:** Confirm that exporting an annotated screenshot with blur or pixelate strips underlying data.
- **Storage Resilience:** Test IndexedDB handle recovery across browser restarts when using custom output folders.
- **Cross-Browser Parity:** Ensure popup UI, menus, and canvas controls render identically on Firefox and Chrome.

**Don't Test:**
- Browser native APIs (`chrome.tabs.create`, `indexedDB.open`) in isolation without extension context.
- Third-party web pages used as test subjects.
