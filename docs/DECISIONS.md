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
- `Superseded by #NNNN` — replaced by a later decision (only the Status field can be edited on a superseded entry)
- `Deprecated` — no longer applies but no replacement

---

## 0001 — Project initialized

**Date:** 2026-09-26
**Status:** Accepted
**Context:** Project scaffolded with the `project-ninja` skill.
**Decision:** Establish AGENTS.md and docs/ as the source of truth for AI agent context. Cross-references owned per `references/cross-references.md` in the project-ninja skill.
**Consequences:** All AI tools (Claude Code, Antigravity, Codex, Cursor, Gemini) read AGENTS.md. Decisions affecting the codebase land here.

---

## 0002 — Chrome DevTools Protocol for full-page capture

**Date:** 2026-09-26
**Status:** Accepted
**Context:** Capturing full-page screenshots via synthetic scrolling and canvas stitching produces severe visual artifacts: duplicated sticky headers, parallax misalignment, and cut-off iframes.
**Decision:** Utilize Chrome DevTools Protocol (`Page.captureScreenshot` with `captureBeyondViewport: true`) attached via `chrome.debugger`.
**Consequences:** Requires the `debugger` permission in `manifest.json`. Guarantees clean, non-stitched full-height page renders. Requires robust attachment/detachment lifecycle handling so tabs are never left in an active debug state.

---

## 0003 — Permanent solid fill for redaction

**Date:** 2026-09-26
**Status:** Accepted
**Context:** Standard canvas blur, pixelation, and mosaic filters are mathematically reversible using modern image de-blurring models, creating serious privacy vulnerabilities when users redact passwords, API keys, or PII.
**Decision:** All canvas redactions use an opaque, destructive solid rectangle fill (`#14171C`) that overwrites underlying image pixels completely.
**Consequences:** Redaction cannot be inverted or reconstructed. Visual appearance is clean, deliberate, and secure.

---

## 0004 — Mandatory halo outlines on annotation shapes

**Date:** 2026-09-26
**Status:** Accepted
**Context:** Arbitrary web page screenshots may feature bright white backgrounds, pure black dark modes, or complex colorful gradients. A single-color arrow or pen stroke frequently loses contrast against dynamic web ground.
**Decision:** Every drawn vector shape (pen, arrow, rectangle, ellipse) renders with a 1.5px contrasting halo outline stroke behind its fill.
**Consequences:** Ensures compliance with WCAG contrast requirements on any captured web ground without requiring users to manually swap swatch colors.

---

## 0005 — Tri-state theme switcher (System, Dark, Light) with real-time sync

**Date:** 2026-09-26
**Status:** Accepted
**Context:** Users require customizable visual modes across the extension (Quick Action popup menu, Dashboard studio, Annotation toolbars, and Settings page), with support for OS-level preferences as well as manual overrides (Dark or Light) without flash of unstyled theme on launch.
**Decision:** Implement a unified tri-state theme architecture stored in `chrome.storage.sync` under `settings.theme` ('system', 'dark', 'light') with instant broadcast via `chrome.storage.onChanged` and zero-dependency synchronous hydration from `localStorage`. Design tokens use `:root, :root[data-theme="dark"]` for default dark native, `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }` for system auto light, and `:root[data-theme="light"]` for manual light overrides. Header quick toggles and the Settings Appearance tab synchronize bidirectionally in real time across all open extension views.
**Consequences:** Seamless theme toggling with zero reload required. Instant cross-view synchronization. Pure CSS icon toggling eliminates state-desynchronization bugs between DOM and storage.

