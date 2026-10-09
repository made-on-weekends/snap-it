# DECISIONS.md

> Settled architectural decisions. **Append-only.** Never edit or delete past entries (one exception: `Status` field of a superseded entry).
> If a decision is reversed, append a new entry with `Supersedes: #NNNN`.

## How to use this file

- Read before contradicting any documented pattern.
- New decisions are added with the next sequential number.
- Each entry has: number, title, date, status, context, decision, consequences, optional `Supersedes`.

## Status values

- `Proposed` — under discussion
- `Accepted` — current
- `Superseded by #NNNN` — replaced by a later decision
- `Deprecated` — no longer applies but no replacement

---

## 0001 — Project initialized

**Date:** 2026-10-08  
**Status:** Accepted  
**Context:** Project scaffolded with the project-ninja skill.  
**Decision:** Establish AGENTS.md and docs/ as the source of truth for AI agent context. Cross-references owned per `references/cross-references.md` in the project-ninja skill.  
**Consequences:** All AI tools (Claude Code, Antigravity, Codex, Cursor) read AGENTS.md. Decisions affecting the codebase land here.

---

## 0002 — Zero-build vanilla architecture

**Date:** 2026-10-08  
**Status:** Accepted  
**Context:** Chrome extensions often introduce heavy bundlers (Webpack, Vite, Rollup) that complicate loading unpacked extensions, slow down the dev feedback loop, and obscure source review during Web Store submission.  
**Decision:** Build SnapIt using pure vanilla JavaScript (ES2022+), native HTML5 Canvas, and CSS custom properties without any build step, transpiler, or bundler.  
**Consequences:** The extension is instantly loaded unpacked directly from the source directory. Third-party runtime dependencies must be avoided.

---

## 0003 — Local-only privacy guarantee

**Date:** 2026-10-08  
**Status:** Accepted  
**Context:** Screenshots often contain sensitive credentials, personal messages, or confidential business layouts. Users need absolute confidence that their screenshots are never leaked.  
**Decision:** Prohibit all external network requests, third-party analytics, remote cloud storage, and telemetry. All image data must stay within the browser memory and local downloads.  
**Consequences:** SnapIt works completely offline. Cloud sharing or hosting integrations will not be built into the core extension.

---

## 0004 — Mozilla Firefox WebExtensions MV3 Support

**Date:** 2026-10-08  
**Status:** Accepted  
**Context:** Users require high-speed screenshot capture and annotation inside Mozilla Firefox as well as Chromium browsers. Firefox uses standard WebExtensions Manifest V3 but has specific differences: requires `browser_specific_settings.gecko`, prefers background scripts event pages, does not support Chrome DevTools Protocol (`chrome.debugger`), and lacks Chromium's `window.showDirectoryPicker` File System Access API.  
**Decision:** Support Mozilla Firefox via a dual-manifest strategy (`manifest.firefox.json`), a dependency-free shell packaging script (`scripts/build-firefox.sh`), and defensive runtime feature detection in the shared codebase. In Firefox, screenshot captures utilize standard `chrome.tabs.captureVisibleTab` and script injection, and file saving defaults cleanly to the native browser download manager.  
**Consequences:** The codebase remains 100% zero-build and vanilla. Developers load unpacked directly from root in Chrome, and run `scripts/build-firefox.sh` to assemble an unpacked package for `about:debugging` in Firefox.

---

## 0005 — Canonical Manifest & Symmetrical Multi-Target Build System

**Date:** 2026-10-08  
**Status:** Accepted  
**Context:** Maintaining independent manifests manually risks drift in version numbers, shared permissions, action properties, and asset paths. Additionally, browser differences require specific configurations (Chromium needs `background.service_worker` and CDP; Firefox needs `background.scripts` and `browser_specific_settings.gecko`). Having asymmetrical naming (e.g. `manifest.base.json` vs `manifest.json` for Chrome vs `manifest.firefox.json` for Firefox) introduces confusion about which file is canonical.  
**Decision:** Establish root `manifest.json` as the single canonical source of truth for all shared extension metadata. A dependency-free script (`scripts/generate-manifests.js`) deterministically produces the target platform manifests (`manifest.chrome.json` with service worker & CDP for Chromium; `manifest.firefox.json` with background scripts & Gecko settings for Firefox). Dedicated packaging scripts (`scripts/build.sh`, `scripts/build-chrome.sh`, `scripts/build-firefox.sh`) package `dist/chrome` and `dist/firefox` along with distribution zip archives.  
**Consequences:** Common metadata is edited only once in `manifest.json`. The file hierarchy is completely symmetrical and intuitive across manifests (`manifest.json` → `manifest.chrome.json` & `manifest.firefox.json`) and packaging scripts (`build.sh` → `build-chrome.sh` & `build-firefox.sh`). Zero-build and vanilla runtime principles remain strictly preserved. Chrome loads unpacked from `dist/chrome`, while Firefox loads from `dist/firefox/manifest.json`.

