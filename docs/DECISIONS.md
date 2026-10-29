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

**Date:** 2026-10-29
**Status:** Accepted
**Context:** Project scaffolded with the project-ninja skill.
**Decision:** Establish AGENTS.md and docs/ as the source of truth for AI agent context. Cross-references owned per `references/cross-references.md` in the project-ninja skill.
**Consequences:** All AI tools (Antigravity, Claude Code, Cursor, Codex) read AGENTS.md. Decisions affecting the codebase land here.

---

## 0002 — Zero runtime dependencies and vanilla JS architecture

**Date:** 2026-10-29
**Status:** Accepted
**Context:** Many extensions suffer from heavy bundler configurations, slow build cycles, and massive node_modules dependencies that complicate extension store reviews.
**Decision:** Keep SnapIt built with vanilla modern JavaScript (ES Modules), native HTML5 Canvas, and browser APIs without React, Vue, or heavy bundlers.
**Consequences:** Instant load times, rapid zero-build debugging, small artifact size, and frictionless Chrome Web Store / Firefox Add-ons review approval.

---

## 0003 — Chrome DevTools Protocol (CDP) for full-page capture

**Date:** 2026-10-29
**Status:** Accepted
**Context:** Scrolling and stitching DOM viewports with JavaScript canvas triggers seam artifacts on sticky headers, fixed navigation bars, and parallax elements.
**Decision:** Use `chrome.debugger` and CDP `Page.captureScreenshot` with `captureBeyondViewport: true` on Chromium browsers, with fallback canvas stitching on environments where debugger is unavailable.
**Consequences:** Pixel-perfect full page screenshots without sticky header duplication; requires explicit debugger detachment in all control flow paths.

---

## 0004 — Canonical brand repository and Google Stitch MCP integration

**Date:** 2026-10-29
**Status:** Accepted
**Context:** Visual design consistency, color ramps, typography, and logos must adhere to brand guidelines without duplicate definitions across projects.
**Decision:** Use `/home/asif/Documents/brands/snapit` as the single source of truth for brand assets and configure Google Stitch MCP locally in `.agents/mcp_config.json` for screen designs and UI systems.
**Consequences:** `assets/theme.css` and `assets/tokens.json` remain in sync with brand specifications; local `.agents/` directory is strictly gitignored to protect API keys.
