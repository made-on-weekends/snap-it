# PRODUCT.md

> What we're building, for whom, and what is explicitly NOT in scope.
> This is the canonical scope document. Agents must check here before adding features.

## Product

A high-speed website screenshot tool for Google Chrome and Mozilla Firefox supporting single-page visible captures, full-page scrolling captures, interactive area selection, and bulk URL queues with a built-in canvas annotation studio.

## Target user

Web designers, frontend developers, QA engineers, technical writers, and digital researchers who frequently document web pages, review UI layouts, report bugs, and annotate web mockups without wanting heavy desktop apps or subscription services.

## Anti-persona

- Users looking for a full video screen recorder or live streaming tool.
- Enterprise QA teams looking for automated headless end-to-end regression testing suites (like Playwright or Cypress).
- Teams wanting a cloud-hosted asset management portal with user accounts and cloud collaboration.

## Core value

Blazing fast, privacy-preserving browser screenshot capture and in-browser canvas annotations with zero build overhead and zero external server dependencies—everything runs locally in Chromium and Gecko browsers.

## In scope (current phase)

- **Visible Viewport Capture:** One-click instant screenshot of the current tab view.
- **Full-Page Scrolling Capture:** Automated scrolling and stitching for full-height web content.
- **Selected Area Capture:** Interactive crosshair overlay to crop and capture specific screen regions.
- **Bulk URL Queue:** Consecutive queued captures with customizable delay timers between pages.
- **Canvas Annotation Studio:**
  - Shapes & Drawing: Arrows, rectangles, circles, lines, freehand pencil.
  - Typography & Badges: Text annotations and numbered step badges.
  - Privacy & Focus: Solid redaction and spotlight focus highlights.
  - Cropping & Framing: Aspect-ratio adjustment and canvas framing.
- **Flexible Export:** Support for PNG, JPEG, and WebP formats with configurable compression quality and filename templates.
- **Keyboard Shortcuts:** Configurable Chrome hotkeys for rapid capture operations.
- **Design System:** Full light and dark mode support powered by brand tokens (`assets/theme.css`).

## Explicitly out of scope

- **Video / Audio Screen Recording:** Reason: SnapIt is dedicated strictly to high-fidelity static image capture and markup. Video recording introduces heavy runtime complexity.
- **Cloud Storage & Syncing:** Reason: Privacy-first architecture. All captures remain local in browser memory and local downloads; nothing leaves the user's browser.
- **Cloud User Authentication / Accounts:** Reason: No external servers or third-party tracking.
- **Optical Character Recognition (OCR):** Reason: Outside core visual documentation workflows.

## Non-goals

- Not a replacement for dedicated video recorders (e.g. Loom, OBS).
- Not a replacement for full headless automated web scrapers or test runners.
- Not a multi-tenant cloud asset management platform.

## Success criteria

- Viewport capture completes in under 300ms.
- Full-page capture handles long pages up to 16,384px height smoothly.
- Zero network requests sent to external servers.
- Unpacked extension bundle size under 2 MB (including bundled typefaces).
