---
brand: SnapIt
system_name: Capture Frame
version: 1.0.0
status: Phase 1 foundation — assumptions flagged in §0, pending founder ruling
last_updated: 2026-08-21
owner_thread: SnapIt — Chrome Extension
category: Browser extension (screenshot capture + annotation)
parent_portfolio: Adommo
modes: [light, dark]
accent_hue: cobalt
typefaces: [Geist, Inter, Geist Mono]
license: All bundled typefaces SIL OFL 1.1
---

# SnapIt · Design System

---

## 0. Open rulings and flagged assumptions

This document is complete and buildable, but four decisions were made by
Claude in the founder's absence. Each is isolated so a reversal costs one
regeneration, not a rebuild.

| # | Assumption made | Cost to reverse |
|---|---|---|
| A1 | **Logo direction A** (aperture bracket) locked as primary. Direction B (bracket + annotation stroke) built and shipped as an alternate. | Swap one filename; both masters exist. |
| A2 | **Cobalt accent** taken from the portfolio palette. Portfolio was declared at capacity at fourteen hues; cobalt's current owner is unknown to this document. | Re-run token emitter with a new hue. ~20 min. |
| A3 | **Standalone brand, umbrella-ready.** Tokens are namespaced `--snap-*` and the geometry is parametric, so folding SnapIt and Token Track under one extensions umbrella later is a rename, not a redesign. | None if done before build. |
| A4 | **Name risk unresolved.** See §1. The mark is name-independent; only the wordmark file depends on the string "SnapIt". | Re-run wordmark outliner. ~5 min. |

---

## 1. The name — and a standing risk

**SnapIt** — the product does one thing and the name says it.

> ⚠️ **Trademark risk, unresolved.** TechSmith's **Snagit** is the incumbent
> screenshot-and-annotation product and has been for two decades. "SnapIt" is
> one letter removed, in the identical product category, with identical
> function. This is the classic shape of a confusingly-similar mark. Chrome
> Web Store removal on a trademark complaint would cost the listing, the
> reviews, and the install base at once.
>
> **Required before any public listing:** Chrome Web Store search, USPTO TESS
> search, and a common-law search for existing "SnapIt" extensions. Nothing in
> this pack should reach a store listing until that clears.
>
> The identity survives a rename. The mark carries no letterform, so only
> `svg/snapit_wordmark*.svg` and the lockups need regenerating.

---

## 2. Brand essence

> **The capture frame, and nothing else in the way.**

A screenshot tool is infrastructure. It appears when summoned, does the thing,
and disappears. Every design decision here resolves to *getting out of the
way*: the UI floats over someone else's page and must never compete with it,
tint it, or obscure more of it than the job requires.

---

## 3. Personality

- **Primary:** the precise instrument. Exact, quiet, predictable. Pixel
  dimensions shown because they matter, not for decoration.
- **Secondary:** the tool that respects the page. Never a takeover, never a
  brand moment on someone else's content.
- **Personal-layer inheritance:** same root as Adommo and the Asif personal
  brand — restraint as confidence, evidence over adjectives.

**Not:** playful mascot utility · gamified prosumer app · AI-everything
screenshot "assistant" · loud freemium upsell surface.

---

## 4. Voice and tone

| Principle | Do | Don't |
|---|---|---|
| State, don't sell | "Capture region" | "Snap it in a flash!" |
| Numbers are the copy | "1284 × 620" | "Perfect size!" |
| Shortcuts over prose | `⌘ ⇧ 4` next to the action | "Press Command Shift Four to…" |
| No exclamation marks | "Copied" | "Copied to clipboard!" |

Sentence case everywhere. Verb-first on all actions. No terminal punctuation
on labels or buttons. Errors say what happened, then what to do.

---

## 5. Hard-nos

1. **No tinting the page.** The overlay scrim is neutral graphite at fixed
   alpha, never a coloured wash. This is the single most important rule.
2. No camera, scissors, or crop-tool clip art.
3. No gradient, glow, or glassmorphism on any chrome that floats over content.
4. No brand colour in the annotation ink set beyond the shared blue.
5. No watermark on exported captures, ever — not even on a free tier.

---

## 6. Visual principles

- **Neutral over warm.** The neutral ramp is cool graphite, not warm ash.
  Warm greys visibly tint whatever page they sit on; a screenshot tool cannot
  afford to shift the colour of the thing being screenshotted.
- **Dual-mode native, neither mode primary.** Chrome's toolbar theme is the
  user's choice, and the extension floats over both light and dark pages. Every
  asset ships in both, and the mark inherits `currentColor` so one file serves
  both toolbar themes.
- **Chrome is thin.** 0.5px hairlines, 6–12px radii, no shadows except
  functional focus rings.
- **Mono carries the data.** Dimensions, coordinates, and keyboard shortcuts
  are always mono with tabular figures.

---

## 7. Colour

Full machine-readable tokens: `docs/snapit_tokens.json`.
Applied theme: `css/snapit_theme.css`.

### Graphite (neutral)

| Stop | Hex | | Stop | Hex |
|---|---|---|---|---|
| 50 | `#F6F7F9` | | 500 | `#646C7B` |
| 100 | `#ECEEF2` | | 600 | `#4A515D` |
| 200 | `#DCDFE6` | | 700 | `#343A44` |
| 300 | `#BCC1CC` | | 800 | `#21252C` |
| 400 | `#8B93A1` | | 900 | `#14171C` |
| | | | 950 | `#0C0E12` |

### Cobalt (accent)

| Stop | Hex |
|---|---|
| 300 | `#7FB2FF` |
| 400 | `#4E90F5` |
| 500 | `#2B72E0` |
| 600 | `#1D57B8` |
| 700 | `#17458F` |

**Why cobalt.** The accent must not collide with the annotation ink the user
draws. Red, amber, and green are all spoken for by markup, so the brand accent
takes the remaining unambiguous UI hue. Blue is shared between brand and ink
deliberately — it is the "default pen" and reads as the tool's own colour.

### Semantic tokens

| Token | Light | Dark |
|---|---|---|
| `bg` | `#F6F7F9` | `#0C0E12` |
| `surface` | `#FFFFFF` | `#21252C` |
| `surface-sunken` | `#ECEEF2` | `#14171C` |
| `text` | `#14171C` | `#ECEEF2` |
| `text-secondary` | `#4A515D` | `#BCC1CC` |
| `text-muted` | `#646C7B` | `#8B93A1` |
| `border` | `#DCDFE6` | `#343A44` |
| `border-strong` | `#BCC1CC` | `#4A515D` |
| `accent` | `#1D57B8` | `#4E90F5` |
| `accent-hover` | `#17458F` | `#7FB2FF` |
| `focus` | `#2B72E0` | `#4E90F5` |
| `on-accent` | `#FFFFFF` | `#0C0E12` |
| `scrim` | `rgba(12,14,18,0.50)` | `rgba(6,7,9,0.62)` |

### Contrast — computed, not estimated

All 18 foreground/background pairings were measured with the WCAG 2.x relative
luminance formula. **Zero failures at AA body (4.5:1).** Verification data is
embedded in `docs/snapit_tokens.json` under `contrast_verification`.

| Pairing | Light | Dark |
|---|---|---|
| text on bg | 16.76 | 16.63 |
| text on surface | 17.96 | 13.24 |
| text-secondary on bg | 7.46 | 10.70 |
| text-secondary on surface | 8.00 | 8.52 |
| text-muted on bg | 4.93 | 6.24 |
| text-muted on surface | 5.29 | 4.97 |
| accent on bg | 6.30 | 6.10 |
| accent on surface | 6.76 | 4.86 |
| on-accent on accent | 6.76 | 6.10 |

**Print:** cobalt-300/400 fall outside CMYK gamut. For solids use cobalt-600
or 700, or a blue spot colour. Proof before press.

---

## 8. Annotation ink — a separate, functional palette

These are **not brand colours.** They are the pens the user draws with, and
they are chosen to be distinguishable from each other on arbitrary content.

| Ink | Hex | On white | On near-black |
|---|---|---|---|
| red | `#E5484D` | 3.91 | 4.94 |
| amber | `#FFB224` | 1.80 | 10.71 |
| green | `#46A758` | 3.03 | 6.37 |
| blue | `#4E90F5` | 3.17 | 6.10 |
| ink | `#14171C` | 17.96 | — |
| paper | `#FFFFFF` | — | 16.63 |

> **Mandatory halo rule.** Amber measures **1.80:1 on white** — effectively
> invisible on a light screenshot. No recolouring fixes this, because ink is
> drawn over content whose colour is unknown at design time. Every annotation
> shape therefore carries a contrasting 1.5px outline via `paint-order: stroke
> fill` (`.snap-annotation` in `css/snapit_components.css`). This is a
> correctness requirement, not a style option — shipping ink without the halo
> makes the amber and green pens unusable on light pages.

---

## 9. Typography

Self-hosted, `fonts/fonts.css`. All SIL OFL 1.1.

| Role | Typeface | Weight |
|---|---|---|
| Display, headings, wordmark | **Geist** | SemiBold 600 |
| Body, UI | **Inter** | Regular 400 / Medium 500 |
| Dimensions, coordinates, keycaps | **Geist Mono** | Regular 400 / Medium 500 |

**Why this pairing.** No collision with the sibling brands: Adommo holds
Instrument Serif / Manrope / JetBrains Mono, the Asif personal brand holds IBM
Plex Mono / Sans. Geist is a neutral grotesque with no editorial character,
which is correct for a tool that must not editorialise over someone else's
page. The mono earns its place functionally — this product displays pixel
dimensions and keyboard shortcuts constantly, and both need tabular figures.

**Scale (px):** 11 · 12 · 13 · 14 · 16 · 18 · 22 · 28 · 36
**Line height:** tight 1.2 · normal 1.55 · relaxed 1.7
**Never** go below 11px. Extension popups are small; the answer is fewer
words, not smaller type.

---

## 10. Logo

### Mark

Two opposing corner brackets. The negative space between them **is** the
capture region — the mark states the product's core gesture without depicting
a camera or a pair of scissors.

**Single-fill monochrome, always.** No dual-tone, no two-colour marks, ever.
All geometry is outlined to filled paths — there is no `stroke` attribute in
any shipped file, so the mark cannot break under non-uniform scaling.

### Two optical masters

A 16px toolbar icon and a 128px store icon are different design problems. The
first geometry (m 6.0 / R 3.5 / w 3.0 / L 3.0) measured **6.4% ink coverage**
at 16px with a 4px maximum row width — the mark effectively disappeared on a
Chrome toolbar. Parameters were swept against pixel-level measurement and two
masters were locked:

| Master | m | R | w | L | Coverage @ target | Used at |
|---|---|---|---|---|---|---|
| display | 5.2 | 3.8 | 3.8 | 4.2 | 12.9% | 48px and above, all lockups, web |
| small | 4.8 | 4.0 | 4.6 | 5.0 | 17.8% | 16px and 32px icons, favicons |

Where `m` = arm centreline inset, `R` = corner radius, `w` = stroke weight,
`L` = arm length beyond the corner, all in a 32-unit viewBox. Exact paths and
parameters: `docs/geometry_lock.json`.

### Wordmark

"SnapIt" outlined from **Geist SemiBold** via HarfBuzz shaping with kerning
applied. No live text, no font dependency. Measured advance 3130 units at
1000 upem; cap height 726.

### Lockups

- **Horizontal (primary).** Mark ink height = **1.32 × cap height**, gap =
  **0.30 × cap height**, mark centred on the wordmark's cap-height midline.
- **Stacked.** Mark ink height = **2.20 × cap**, gap = **0.38 × cap**,
  centred.

Both scale the mark by its **ink bounds**, not its nominal 32-unit box. The
mark's arms are inset, so box-scaling renders it roughly 18% undersized — an
error caught in visual QA and corrected.

### Clearspace and minimum sizes

- **Clearspace:** one corner-radius unit (R at the active master) on all sides.
- **Minimum:** mark 16px · horizontal lockup 96px wide · stacked 64px wide.

### Never

Stretch or scale non-uniformly · recolour outside graphite/cobalt · add
shadow, glow, or gradient · place on busy or photographic backgrounds ·
rebuild the wordmark in another typeface · fill the mark with an annotation
ink colour · apply the brand accent to the mark inside the capture overlay
(the accent there belongs to the selection rectangle).

---

## 11. Product surfaces

**Capture overlay.** Neutral scrim over the page. Selection rectangle in
2px accent with four corner handles. Live dimension readout in mono, pinned
above the selection's top-left. Floating annotation toolbar below the
selection, flipping above when the selection sits near the viewport bottom.

**Toolbar order (locked):** rectangle · arrow · freehand · text · redact ·
divider · ink swatches · divider · primary action.

**Redaction is not a blur.** Redact fills solid; blur is reversible in
principle and should never be offered as a privacy affordance.

**Popup panel.** Three capture modes as bordered rows, each with its keyboard
shortcut in mono, right-aligned. No hero, no illustration, no upsell.

**Empty and error states.** "Nothing captured yet" is banned. Name the space
and give the verb.

---

## 12. Asset pack

```
snapit_brand/
├── DESIGN.md
├── svg/            23 marks, wordmarks, lockups (light / dark / currentColor)
├── icons/          MV3 matrix 16/32/48/128, light + dark toolbar variants
├── favicon/        16/32/48/180/192/512 PNG + rounded tile SVGs, both modes
├── store/          promo tile 440×280, marquees, OG 1200×630, both modes
├── css/            snapit_theme.css · snapit_components.css
├── fonts/          Geist / Geist Mono / Inter — woff2 + ttf + fonts.css + OFL
└── docs/           snapit_tokens.json · geometry_lock.json · manifest_snippet.json
```

> **Web Store specs unverified.** Promo tile and marquee dimensions were
> generated from commonly-published figures, not from a live read of Google's
> current developer documentation. Confirm against the Chrome Web Store listing
> requirements before upload; regeneration is one parameter change.

---

## 13. Open items

- Rulings A1–A4 in §0.
- Microcopy pass: full error and empty-state inventory.
- Iconography: the toolbar currently assumes an existing outline icon set;
  a named set has not been chosen.
- Onboarding surface — deferred until the monetisation question is answered,
  since a paid tier changes whether one is needed at all.
- Options/settings page component sheet.

**Stability:** identity intended stable ~1 year, consistent with BRAND-001 and
BRAND-002 practice.

**Priority note:** per operating principle 11, this build does not outrank
outreach on the revenue path.
