# PRODUCT.md

> What we're building, for whom, and what is explicitly NOT in scope.
> This is the canonical scope document. Agents must check here before adding features.

## Product

SnapIt is a high-speed, privacy-first browser extension for capturing viewports, full scrollable documents, and selected regions, complete with bulk URL queue processing and an integrated local canvas annotation studio.

## Target User

- **Frontend Developers & QA Engineers:** Capturing layout bugs, verifying responsive viewports, and generating test artifact archives.
- **UI/UX Designers & Product Managers:** Marking up feedback, creating step-by-step issue callouts, and annotating edge-case behaviors.
- **Technical Writers & Support Specialists:** Creating clean, redacted product documentation screenshots with numbered step badges and callouts.

## Anti-Persona

- **Casual social-media screenshotters:** Users looking for instant cloud sharing links, public link shorteners, or social feed integrations. SnapIt stores files locally on disk.

## Core Value

Zero-latency, local-first capture and annotation. No mandatory login, no slow uploads to third-party cloud buckets, and complete user privacy.

## In Scope (Current Phase)

- **Capture Modes:**
  - Viewport capture (`chrome.tabs.captureVisibleTab`)
  - Full-page document capture via Chrome DevTools Protocol (`Page.captureScreenshot` with scroll emulation)
  - Interactive crop selection overlay
- **Canvas Annotation Studio:**
  - Shapes (rectangles, ellipses, lines)
  - Directional arrows and connectors
  - Numbered step badges
  - Text callouts with typography control
  - Loupe zoom magnifier
  - Spotlight overlay
  - Permanent privacy redaction (blur, pixelate, blackout)
- **Batch Capture Pipeline:**
  - Bulk URL queue with automated sequential loading, capture, and download
  - Configurable inter-request throttling and delay via `chrome.alarms`
- **Output & Storage:**
  - Native browser downloads (`chrome.downloads`)
  - Local direct folder output via File System Access API with persistent IndexedDB directory handles
  - PNG and JPEG format selection with quality controls

## Explicitly Out of Scope

- **Cloud screenshot hosting:** Reason: SnapIt is strictly local-first and privacy-focused; we do not run public image hosting or pasteboard servers.
- **Video / GIF recording:** Reason: SnapIt is optimized for high-fidelity static image capture and vector-crisp annotation.
- **Mandatory accounts / paywalls:** Reason: Essential local tool functionality requires no remote authentication.
- **Server-side scraping proxies:** Reason: All captures execute directly within the user's browser runtime and authenticated tab sessions.

## Success Criteria

- Viewport capture completes in under 200ms.
- Full-page CDP captures generate zero seam artifacts across dynamic sticky headers.
- Annotation studio operates at 60 FPS on standard desktop hardware.
- Firefox and Chromium builds generate from shared codebase with zero build regressions.
