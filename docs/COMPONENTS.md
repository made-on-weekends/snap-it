# COMPONENTS.md

> Reusable UI component rules and inventory.
> Visual tokens owned by `docs/DESIGN.md`; identity rules owned by `docs/BRAND.md`.

## Component conventions

- **Location:** `popup/`, `content/`, and `settings/`.
- **Styling:** CSS custom properties defined in `assets/theme.css` (e.g. `var(--surface)`, `var(--accent)`, `var(--border)`).
- **Type Scale:** Geist Display for titles, Inter for UI controls and labels, Geist Mono for dimensions, counters, and keycaps.

## Base components

| Component | Purpose | Location | Styling & Dimensions |
|---|---|---|---|
| `Keycap` | Keyboard shortcut badge | `popup/`, `settings/` | Geist Mono 11px, `surface-sunken` fill, 1px border, 4px radius |
| `Toast` | Floating status confirmation | `popup/` | 13px Inter, 8px radius, two-ring edge, `surface` fill, 2s duration |
| `ButtonPrimary` | Main action trigger | `popup/`, `settings/` | 32px height, `accent` fill, `text-on-accent` label, 6px radius |
| `ButtonSecondary`| Secondary action | `popup/`, `settings/` | 32px height, `surface` fill with 1px border, 6px radius |
| `ButtonGhost` | Dismiss or tertiary trigger | `popup/` | 32px height, transparent background, hover tint |
| `InkSwatch` | Annotation color selector | `popup/annotation.js` | 20px square, 6px radius with halo ring |

## Composite components

| Component | Purpose | Location | Description |
|---|---|---|---|
| `PopupPanel` | Main extension action menu | `popup/menu.html` | 320px wide, max 480px height, 12px padding, brand lockup at top left, three capture mode rows with keycaps |
| `AnnotationToolbar` | Canvas drawing controls | `popup/annotation.js` | 40px tall floating bar, 8px padding, 4px gap, 8px radius, two-ring edge: tools · divider · swatches · divider · action |
| `AreaSelector` | Crosshair crop overlay | `content/area-selector.js` | Neutral scrim, 2px cobalt stroke rectangle, 8px corner handles, tabular Geist Mono dimension pill |
| `SettingsCard` | Options category container | `settings/settings.html` | 720px max width, 12px radius, 1px border, `surface` fill, 32px vertical gap |

## Annotation tool inventory

1. **Rectangle (`square`):** Clean 2px stroke geometric box with halo.
2. **Arrow (`move-up-right`):** Directional pointer with sharp arrowhead.
3. **Freehand (`pencil`):** Smooth path curve for freeform markup.
4. **Text (`type`):** High-contrast label in Inter 14px/16px.
5. **Redact (`rectangle-horizontal`):** 100% solid ink fill blocking sensitive content. Never blurred.
6. **Spotlight:** Soft darkened mask leaving selected region bright.
7. **Step Badges:** Circular numbered indicators (1, 2, 3...) for sequential workflow instructions.
