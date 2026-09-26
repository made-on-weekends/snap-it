# COMPONENTS.md

> Reusable UI component catalog, toolbar layouts, and annotation tools inventory.

## Component Overview

SnapIt's interface is built on clean, semantic HTML5 components styled with CSS Custom Properties derived from `docs/DESIGN.md`.

---

## 1. Quick Action Launcher (`popup/menu.html`)

- **Header Bar:** Brand wordmark (`Geist SemiBold`) and icon badge.
- **Action Buttons (`.menu-action-btn`):**
  - Full Page Capture (`⌘ + ⇧ + 1`)
  - Viewport Capture (`⌘ + ⇧ + 2`)
  - Batch Queue Dashboard (`⌘ + ⇧ + 3`)
  - Annotation Studio (`⌘ + ⇧ + 4`)
- **Footer:** Quick link to Settings and GitHub repository.

---

## 2. Batch Queue Dashboard (`popup/popup.html`)

- **Tab Navigation Bar:** Switches between "Batch Queue" and "Annotation Studio" modes with smooth transitions.
- **URL Textarea Input:** Accepts newline-delimited lists of target URLs with optional bracketed labels (`https://example.com [Example]`).
- **Batch Configuration Controls:**
  - Delay interval stepper (1s to 30s) to account for lazy-loaded images and dynamic scripts.
  - Image format selector (PNG, JPEG, WebP).
  - Directory storage indicator with File System Access status.
- **Queue Progress Bar:** Real-time completion percentage and current active URL indicator.
- **Results Table (`.batch-results-list`):**
  - Thumbnail preview
  - URL and label
  - HTTP / Capture status badge (`Success`, `Pending`, `Failed`)
  - Quick action buttons: Open in Studio, Download, or Remove.

---

## 3. Annotation Studio (`popup/popup.html` & `popup/annotation.js`)

- **Canvas Viewport Container (`#canvas-container`):** Scrollable, zoomable stage holding the captured image bitmap and drawing overlay.
- **Floating Main Toolbar (`.studio-toolbar`):**
  - **Tool Group:**
    - `Select / Move (V)`: Select, drag, resize, or delete existing annotations.
    - `Crop (K / X)`: Interactive bounding box for non-destructive canvas cropping.
    - `Arrow (A)`: Precision directional pointer with calculated arrowhead.
    - `Rectangle (R)`: Box boundary with rounded corner support.
    - `Circle / Ellipse (C)`: Elliptical callout.
    - `Pen (P)`: Freehand drawing with quadratic curve smoothing.
    - `Text (T)`: Editable canvas text notes with background badge.
    - `Highlighter (H)`: Semi-transparent ink (`alpha: 0.35`) for emphasizing text.
    - `Redact (B)`: Destructive solid opaque fill (`#14171C`) for obscuring credentials or PII.
- **Color & Style Properties (`.style-properties-group`):**
  - Direct functional ink swatches:
    - Red (`#E5484D`) — High-priority callouts and bugs
    - Amber (`#FFB224`) — Warnings and attention
    - Cobalt (`#4E90F5`) — Information and primary focus
    - Emerald (`#30A46C`) — Validated or approved items
    - Violet (`#8E4EC6`) — Secondary notes
    - Slate (`#646C7B`) — Neutral markup
  - Stroke width selector: Thin (2px), Medium (4px), Thick (8px).
- **Canvas Action Group:**
  - `Undo (Ctrl + Z)`: Reverts last annotation state.
  - `Redo (Ctrl + Y)`: Restores reverted annotation.
  - `Clear All`: Clears all markup after confirmation.
  - `Copy`: Copies rendered image directly to OS clipboard.
  - `Download`: Exports composite image to disk.

---

## 4. Settings Preferences (`settings/settings.html`)

- **Card Layout Container:**
  - **Capture Settings Card:** Default format, JPEG/WebP quality slider, default capture delay.
  - **Filename Pattern Card:** Token-based filename generator (`{domain}-{date}-{time}-{label}`).
  - **Storage Location Card:** Directory handle picker using the File System Access API with persistent permission toggle.
  - **Shortcuts Card:** Visual cheatsheet of active browser command bindings.

---

## Design Tokens Integration

All components reference CSS custom properties defined in `assets/theme.css`:
- Backgrounds: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-tertiary)`
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
- Accent: `var(--accent-primary)`, `var(--accent-hover)`, `var(--focus-ring)`
- Borders: `var(--border-subtle)`, `var(--border-strong)`
- Radii: `var(--radius-sm)` (4px), `var(--radius-md)` (8px), `var(--radius-lg)` (12px)
