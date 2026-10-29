# BRAND.md

> Identity layer: voice, naming, logo, positioning. Token values and full design specs live in [docs/DESIGN.md](DESIGN.md).

## Positioning

SnapIt is the high-speed browser capture and annotation tool for developers, designers, QA engineers, and remote teams who need instant, pixel-accurate web screenshots without clunky cloud bloat or slow upload workflows.

## Voice

Direct, precise, technical, focused, zero fluff.

### Voice Rules

**Do:**
- Lead with the action; keep UI labels terse and immediately understandable (e.g., "Capture Area", "Full Page", "Save").
- Treat privacy and data ownership as sacred — all captures remain local unless explicitly exported.
- Give exact status and progress during multi-URL captures (e.g., "Capturing 3 of 12...").

**Don't:**
- Don't use marketing hyperbole ("revolutionary", "magical").
- Don't condescend ("simply click", "just wait").
- Don't clutter capture screens with decorative noise or excessive animations.

## Brand-Defining Color Choices

Exact hex values and semantic roles live in `docs/DESIGN.md` and `assets/theme.css`:

- **Primary Accent:** Cobalt Blue (`--accent`, `#006DAB` light / `#00A4E4` dark)
- **Base Background:** Neutral graphite (`--background`, `#F6F7F9` light / `#0C0E12` dark)
- **Surface:** Clean white/slate (`--surface`, `#FFFFFF` light / `#21252C` dark)
- **Border / Lines:** Subtle graphite boundaries (`--border`, `#DCDFE6` light / `#343A44` dark)
- **Scrim Overlay:** Neutral graphite at fixed alpha (no page tinting)

## Brand-Defining Typography Choices

Values (scales, line heights, weights) live in `docs/DESIGN.md`:

- **Primary UI Typeface:** Geist / Inter (bundled WOFF2)
- **Code & Numeric Monospace:** Geist Mono (bundled WOFF2)

## Logo and Marks

- `assets/svg/logo-light.svg`: Used on light backgrounds.
- `assets/svg/logo-dark.svg`: Used on dark backgrounds.
- `assets/svg/logo-stacked-light.svg` / `logo-stacked-dark.svg`: Used in tight or square contexts.
- `assets/svg/icon.svg`: Base icon for browser extension toolbar and favicons.

### Critical Brand Rules

1. **No tinting the page:** The capture scrim is neutral graphite at fixed alpha — never tint web pages with brand colors.
2. **Redaction is irreversible:** Redaction tools (pixelate, blackout, blur) must permanently burn into exported raster output.
3. **No brand accent inside capture overlay:** Keep annotation and overlay tools focused on user content, not brand flourishes.
4. **Minimum type size:** Text elements should never render below 11px.

## Naming

- **Product Name:** SnapIt (PascalCase in prose; `snap-it` in kebab-case package identifiers)
- **Company Name:** Adommo LLC
- **Tagline:** High-speed capture & annotation studio
