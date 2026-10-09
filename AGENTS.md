# AGENTS.md

> Briefing packet for AI coding agents (Claude Code, Antigravity, Codex, Cursor, Gemini CLI, etc.).
> Humans should read README.md instead.

## Rules of engagement

These rules are the agent's first read every session.

1. **Do** follow conventions documented in this file and the relevant `docs/` file. **Don't** invent new conventions silently.
2. **Do** check `docs/DECISIONS.md` before contradicting any documented pattern.
3. **Do** read `docs/SECURITY.md` Hard Rules before touching extension permissions, Content Security Policy, or tab scripting.
4. **Do** ask before expanding scope beyond `docs/PRODUCT.md`.
5. **Don't** edit files in the do-not-touch zones below.
6. **Don't** introduce bundlers, transpilers, or third-party npm runtime dependencies without a `docs/DECISIONS.md` entry. SnapIt is committed to zero-build vanilla execution.
7. **Do** enforce and conform to `.editorconfig` formatting rules (2 spaces indentation, LF line endings, UTF-8 charset, whitespace trimming) across all code and documentation.
8. **Do** verify browser extension compatibility with Manifest V3 standards on any change.

## Stack

- **Platform:** Google Chrome / Chromium & Mozilla Firefox Extension (Manifest V3)
- **Language(s):** Vanilla JavaScript (ES2022+), HTML5 Canvas, CSS3
- **Build / Tooling:** None (Zero build step; pure runtime scripts loaded unpacked)
- **Runtime:** Chrome Service Worker / Firefox Event Page + Extension Popups & Content Scripts
- **Styling:** CSS Custom Properties driven by brand tokens (`assets/theme.css`)
- **Typography:** Geist, Inter, and Geist Mono (`assets/fonts/`)

## Commands

```bash
# === Manifests & Build Scripts ===
# Generate platform manifests from canonical manifest.json:
node scripts/generate-manifests.js
# Or build packages for both Chrome and Firefox:
./scripts/build.sh
# Target-specific packaging:
./scripts/build-chrome.sh    # (or ./scripts/build.sh chrome) -> outputs to dist/chrome and dist/snap-it-chrome.zip
./scripts/build-firefox.sh   # (or ./scripts/build.sh firefox) -> outputs to dist/firefox and dist/snap-it-firefox.zip

# === Google Chrome / Chromium ===
# 1. Assemble unpacked package:
./scripts/build-chrome.sh    # (or ./scripts/build.sh chrome)
# 2. Open chrome://extensions
# 3. Enable "Developer mode" toggle
# 4. Click "Load unpacked" and select dist/chrome
# Click refresh/reload icon on the SnapIt card after code edits

# === Mozilla Firefox ===
# 1. Assemble unpacked package:
./scripts/build-firefox.sh   # (or ./scripts/build.sh firefox)
# 2. Open about:debugging#/runtime/this-firefox
# 3. Click "Load Temporary Add-on..." and select dist/firefox/manifest.json
# Click "Reload" on the temporary add-on card after running build-firefox.sh
```

## Conventions

- **Code Style & Formatting:** Strict adherence to `.editorconfig` is required across all project files (UTF-8, LF, 2 spaces).
- **Zero Build Step:** Keep all JavaScript directly executable by Chromium without preprocessing.
- **Service Worker Lifecycle:** Background operations run inside `service-worker.js`. Do not rely on persistent global in-memory state; use `chrome.storage.session` and `chrome.storage.local` via `storage-helper.js`.
- **Content Scripts:** Keep `content/area-selector.js` isolated and lightweight; clean up DOM elements and event listeners after area selection completes.
- **Design Tokens:** Always reference CSS custom properties defined in `assets/theme.css` (e.g. `var(--accent)`, `var(--surface)`). Never hardcode hex values in CSS or HTML.
- **Design Specifications:** All design rules in `docs/DESIGN.md` follow the Google Labs `design.md` specification.

## Do-not-touch zones

- `assets/fonts/` — Vendored font files (SIL Open Font License)
- `assets/svg/` & `assets/icons/` — Canonical brand cuts sourced from brand repository
- `.agents/` — Local developer and agent configuration (gitignored)
- `LICENSE` — Project license

## Where to look

- Architecture overview: `docs/ARCHITECTURE.md`
- Settled decisions: `docs/DECISIONS.md` (read before contradicting any pattern)
- Security rules & threat model: `docs/SECURITY.md` (and root `SECURITY.md`)
- Product scope: `docs/PRODUCT.md`
- Component library & UI rules: `docs/COMPONENTS.md`
- Design tokens & styles: `docs/DESIGN.md`
- Brand identity: `docs/BRAND.md`
- User experience & interaction flows: `docs/UX.md`
- Testing strategy: `docs/TESTING.md`

## Pull request expectations

- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`.
- Update corresponding documentation in `docs/` if modifying features, architecture, or permissions.
- Test changes manually by reloading the unpacked extension in Chrome.
