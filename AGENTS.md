# AGENTS.md

> Briefing packet for AI coding agents (Claude Code, Antigravity, Codex, Cursor, Gemini CLI, etc.).
> Humans should read README.md instead.

## Rules of engagement

These rules are the agent's first read every session. Keep this list short — 5–10 rules, each one absolute.

1. **Do** follow conventions documented in this file and the relevant `docs/` file. **Don't** invent new conventions silently.
2. **Do** check `docs/DECISIONS.md` before contradicting any documented pattern.
3. **Do** read `docs/SECURITY.md` Hard Rules before touching auth, data handling, or any input-validation code (if created).
4. **Do** ask before expanding scope beyond `docs/PRODUCT.md`.
5. **Don't** edit files in the do-not-touch zones below.
6. **Don't** introduce a new third-party dependency without a `docs/DECISIONS.md` entry.
7. **Do** run syntax check command `node -c <files>` before claiming code is complete.

## Stack

- Language(s): HTML5, Vanilla JavaScript (ES2022+)
- Framework(s): None (Vanilla Chrome Extension Manifest V3)
- Backend: None (Runs in browser worker context)
- Database: IndexedDB (for persisting FileSystemDirectoryHandle), chrome.storage.sync (settings), chrome.storage.session (live capture session state)
- Hosting / runtime: Chrome Extension Runtime (Chromium 100+)
- Package/dependency manager: None
- Language version: ECMAScript 2022+

## Commands

```bash
# Verify JavaScript syntax check
node -c storage-helper.js service-worker.js popup/popup.js popup/annotation.js popup/menu.js settings/settings.js
```

## Conventions

- **Design Specifications:** All design files (including `docs/DESIGN.md` and its derived/override mirror files) must strictly adhere to the Google Labs `DESIGN.md` format specification (combining machine-readable YAML frontmatter with standard markdown sections). Verify correctness using `npx @google/design.md lint <filepath>`.
- **File naming and casing:** Flat files, relative directory layouts. Use kebab-case or standard lowercase with hyphens for extensions.
- **State storage:** Session storage (`chrome.storage.session`) is used to store and synchronize capture status and log history between the background service worker and the controller UI. Sync storage (`chrome.storage.sync`) is used for long-term user settings. IndexedDB is used for directory handles.
- **Error-handling:** Return errors in message responses (`sendResponse({ error: err.message })`) instead of throwing unhandled exceptions across thread boundaries.

## Project-specific rules

- "All filesystem writes for custom folders must be routed to the controller tab (`popup.js`) via messaging, as background service workers cannot write to FileSystemDirectoryHandles directly without page context."
- "Never bypass `storage-helper.js` when reading or writing directory handles."

## Do-not-touch zones

- `icons/` (Contains generated icon assets)
- `.venv/` (Python virtual environment)

## Where to look

- Architecture overview: `docs/ARCHITECTURE.md`
- Settled decisions: `docs/DECISIONS.md` (read before contradicting any pattern)
- Product scope: `docs/PRODUCT.md`
