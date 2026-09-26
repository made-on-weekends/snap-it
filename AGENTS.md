# AGENTS.md

> Briefing packet for AI coding agents (Claude Code, Antigravity, Codex, Cursor, Gemini CLI, etc.).
> Humans should read [README.md](README.md) instead.

## Rules of engagement

These rules are the agent's first read every session. Keep this list short — 5–10 rules, each one absolute.

1. **Do** follow conventions documented in this file and the relevant `docs/` file. **Don't** invent new conventions silently.
2. **Do** check [docs/DECISIONS.md](docs/DECISIONS.md) before contradicting any documented pattern.
3. **Do** read [docs/SECURITY.md](docs/SECURITY.md) Hard Rules before touching debugger, downloads, or storage permissions.
4. **Do** ask before expanding scope beyond [docs/PRODUCT.md](docs/PRODUCT.md).
5. **Don't** edit files in the do-not-touch zones below.
6. **Do** enforce and conform to [.editorconfig](.editorconfig) formatting rules (2-space indentation, LF line endings, UTF-8 charset, whitespace trimming) across all code and documentation.
7. **Don't** introduce third-party libraries, npm dependencies, or build tools without explicit approval recorded in [docs/DECISIONS.md](docs/DECISIONS.md). SnapIt is an intentional zero-dependency vanilla extension.
8. **Do** ensure Chrome DevTools Protocol (`chrome.debugger`) sessions always detach in `finally` blocks or error handlers to prevent persistent yellow debugging banners on target tabs.
9. **Do** enforce the Canvas Halo Rule: every annotation stroke/shape carries a contrasting 1.5px outline to guarantee contrast against arbitrary web page ground.
10. **Do** enforce solid redaction: canvas redaction is always a destructive opaque fill (`#14171C`), never blur or pixelation filters (which are mathematically reversible).

## Stack

- **Platform:** Chrome Extension Manifest V3
- **Language:** JavaScript (ES2022+)
- **UI:** Native HTML5, CSS3 Custom Properties (Design Tokens)
- **Runtime:** Chromium Browser Engine (Event-driven Service Worker + Action Popup & Fullpage Dashboard)
- **Protocol:** Chrome DevTools Protocol (CDP) `Page.captureScreenshot` & `Emulation.setDeviceMetricsOverride`
- **Storage:** `chrome.storage.sync` (options), `chrome.storage.local` (active state & queues), File System Access API
- **Dependencies / Package Manager:** None (Vanilla browser APIs, no npm build step)

## Commands

```bash
# Development: Load unpacked extension
# 1. Open chrome://extensions in Chromium/Chrome
# 2. Toggle "Developer mode" in the top-right
# 3. Click "Load unpacked" and select this repository root

# Debugging Service Worker:
# Click "Inspect views: service worker" in chrome://extensions

# Debugging Popup / Annotation Studio:
# Right-click the extension popup or studio page and choose "Inspect"

# Format / Lint validation:
# Verify conformance to .editorconfig (2 spaces, LF, UTF-8)
npx -y @google/design.md lint docs/DESIGN.md
```

## Conventions

- **Code Style & Formatting (.editorconfig):** Strict adherence to [.editorconfig](.editorconfig) is required. All JavaScript, CSS, HTML, and JSON files use 2 spaces for indentation, LF line endings, and trimmed trailing whitespace. Markdown files preserve trailing whitespace for linebreaks.
- **Design Specifications:** All design files (including [docs/DESIGN.md](docs/DESIGN.md)) must adhere to the Google Labs `design.md` specification with machine-readable YAML frontmatter. Validate with `npx @google/design.md lint docs/DESIGN.md`.
- **Canvas State & Undo/Redo:** Every stroke or action in `popup/annotation.js` is pushed to an immutable history stack with integer coordinates to avoid sub-pixel canvas blurring.
- **Error Handling:** Background service worker operations catch CDP exceptions, detach debuggers cleanly, and send descriptive JSON message objects to active popups with toast feedback.

## Do-not-touch zones

- `icons/` — Canonical raster extension icons (16px, 32px, 48px, 128px)
- `assets/fonts/` — Vendored webfonts and OFL licenses
- `LICENSE` — Project license file

## Where to look

- Product scope: [docs/PRODUCT.md](docs/PRODUCT.md)
- Architecture overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Settled decisions: [docs/DECISIONS.md](docs/DECISIONS.md)
- Design tokens & typography: [docs/DESIGN.md](docs/DESIGN.md)
- Brand identity & voice: [docs/BRAND.md](docs/BRAND.md)
- UI components: [docs/COMPONENTS.md](docs/COMPONENTS.md)
- User flows & UX: [docs/UX.md](docs/UX.md)
- Security rules & threat model: [docs/SECURITY.md](docs/SECURITY.md)
- Testing strategy: [docs/TESTING.md](docs/TESTING.md)
