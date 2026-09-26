# PRODUCT.md

> What we're building, for whom, and what is explicitly NOT in scope.
> This is the canonical scope document. Agents must check here before adding features.

## Product

**SnapIt** is a fast, client-side Chromium browser extension for capturing high-fidelity single-page screenshots, full-height scrollable web pages via Chrome DevTools Protocol (CDP), and sequential bulk URL queues, paired with an instant HTML5 canvas annotation studio.

## Target user

- **Web Developers & Frontend Engineers:** Need exact viewport and full-height page renders to verify responsive layouts, diagnose visual rendering bugs, and inspect UI states across multiple URLs.
- **QA Testers & Bug Hunters:** Need instant screenshot markup (arrows, notes, boxes, redactions) to attach reproducible visual evidence to issue trackers.
- **Designers & UX Researchers:** Need clean page captures without clipping sticky navigation bars or parallax backgrounds.
- **SEO & Content Specialists:** Need batch visual audits across dozens of landing pages or competitor URLs.

## Anti-persona

- **Video Screencasters:** Users looking for screen recording, audio commentary, GIF generation, or webcam overlays.
- **Enterprise Collaborative Teams:** Users looking for cloud-hosted whiteboard spaces (e.g. Miro/Figma), team workspaces, or multi-user real-time shared canvases.

## Core value

**100% client-side, zero-cloud-dependency capture fidelity.** Using direct Chrome DevTools Protocol commands (`Page.captureScreenshot`), SnapIt captures true full-height document bitmaps without fake scrolling hacks or fragmented stitches, then delivers immediate local annotation and directory saving.

## In scope (current phase)

- **Full-Page Scrolling Capture:** CDP debugger-driven document metrics override and capture without scrolling artifacts.
- **Visible Viewport Capture:** Instant active tab snapshot.
- **Sequential Bulk URL Queue:** Process a batch list of URLs with custom inter-request delay timers and automatic file naming.
- **Integrated Canvas Annotation Studio:**
  - Tools: Select/Move (`V`), Crop (`K`/`X`), Arrow (`A`), Rectangle (`R`), Ellipse (`C`), Freehand Pen (`P`), Text Notes (`T`), Highlighter (`H`), and Redact (`B`).
  - **Permanent Redaction:** Solid, destructive opaque fills (`#14171C`) that permanently obscure sensitive credentials or PII.
  - **Contrasting Halos:** 1.5px contrasting halo outlines around all drawn shapes to guarantee legibility against light or dark web pages.
  - Full Undo / Redo history stack.
- **Export & Storage Options:** Direct file downloads via `chrome.downloads` and direct folder saving via File System Access API.
- **Configurable Formats:** PNG, JPEG, and WebP with user-defined compression quality.

## Explicitly out of scope

- **Screen video and audio recording:**
  *Reason:* WebRTC media stream capture introduces heavy memory overhead and completely different extension architecture; SnapIt focuses exclusively on static image precision.
- **Third-party cloud hosting / uploads (Imgur, AWS S3, Cloudinary):**
  *Reason:* SnapIt guarantees total data privacy and zero data leakage by keeping all captured assets local to the user's workstation.
- **User accounts, authentication, or cloud sync:**
  *Reason:* The extension is fully functional out-of-the-box without sign-ins, subscription tiers, or external server tracking.
- **Live multi-user collaborative canvas:**
  *Reason:* Requires real-time WebSocket servers and remote state sync, contrary to the offline, client-side design.

## Non-goals

- Not a replacement for video screencasting tools (e.g. Loom).
- Not a cloud asset management library.

## Success criteria

- Full-page captures render accurately up to Chromium's maximum canvas size without memory crashes.
- Annotation studio maintains 60fps responsiveness during drawing operations.
- Zero external network requests made by the extension for capture or annotation operations.
