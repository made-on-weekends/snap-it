# BRAND.md

> Identity layer: voice, naming, logo, positioning. Token values live in `DESIGN.md`.

## Positioning

SnapIt is the high-speed website screenshot tool for web professionals who want clean, instant viewport captures, full-page stitching, and canvas annotations without heavy desktop apps, external build steps, or cloud lock-in.

## Voice

- **Direct:** Lead with the action verb; explain why second.
- **Calm & Technical:** Terse, neutral, and precise without hype or fluff.
- **No-nonsense:** No exclamation marks, no marketing superlatives ("amazing", "ultimate"), no patronizing words ("simply", "just").

### Voice rules

**Do:**
- Speak in plain, concise sentence case.
- State what happened and then what to do next.
- Render shortcuts as keycaps (`⌘ ⇧ 4`, `Ctrl + Shift + S`) rather than prose.
- Display dimensions in tabular Geist Mono (`1280 × 720`).

**Don't:**
- Don't use exclamation marks anywhere in user-facing copy or toast notifications.
- Don't use "Oops!" or "Error:" prefixes in error messages.
- Don't use clip art metaphors (no camera, scissors, or cartoon crop icons).
- Don't tint the underlying web page when rendering selection scrims.

### Voice by context

- **Popup & Studio:** Terse, action-oriented button labels ("Capture visible tab", "Copy", "Save to Downloads").
- **Toasts:** Exact feedback without punctuation ("Copied", "Saved to Downloads", "Copied · 1280 × 720").
- **Errors:** Empathetic and instructive ("Couldn't copy. Download instead?", "Chrome doesn't allow captures on this page. Try another tab.").

## Brand-defining color choices

Values live in `docs/DESIGN.md` (and `assets/theme.css`); named roles appear here:
- **Graphite (Neutral):** Primary backgrounds, surfaces, and text tokens.
- **Cobalt (Accent):** Interactive highlights, selection rectangle strokes, and primary buttons.
- **Solid Inks:** Crisp annotation colors (red, blue, green, yellow, white, black) with halo rings for dark/light legibility.

## Brand-defining typography choices

Typeface details and full scale live in `docs/DESIGN.md`.
- **Primary / Display Typeface:** Geist (OFL 1.1)
- **UI / Body Typeface:** Inter (OFL 1.1)
- **Monospace / Keycap Typeface:** Geist Mono (OFL 1.1)

## Logo and marks

- Sourced canonically from `/home/asif/Documents/brands/snapit/assets/svg/`.
- **Lockups:** `logo-light.svg`, `logo-dark.svg`, `logo-wordmark-light.svg`, `logo-wordmark-dark.svg`.
- **Icons:** `icon.svg` (and raster cuts in `assets/icons/`).
- **Hard Rules:**
  - Inside the capture overlay, the logo mark never carries the cobalt accent—use neutral ink to avoid visual collision with the selection rectangle.
  - Never stretch, rotate, add dropshadows, or place on busy gradients.

## Naming

- **Product name:** SnapIt (CamelCase, no hyphen in user-facing branding)
- **Repository name:** `snap-it`
- **Owner / Company:** Adommo LLC
- **Tagline:** High-speed website screenshot tool for Chrome.
