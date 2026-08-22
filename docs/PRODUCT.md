# PRODUCT.md

> What we're building, for whom, and what is explicitly NOT in scope.
> This is the canonical scope document. Agents must check here before adding features.

## Product

SnapIt is a browser extension that automates bulk website screenshot capture from a user-provided list of URLs, executing the jobs in a queue with adjustable wait times and saving them directly to a local folder.

## Target user

Web developers, QA testers, designers, and SEO marketers who regularly need to perform visual audits of dozens or hundreds of URLs and want to capture screenshots quickly without doing it manually.

## Anti-persona

End consumers looking for a simple single-page clipper (like standard print-screen extensions), or enterprise users looking for a fully-managed cloud screenshot API.

## Core value

SnapIt provides a dead-simple, zero-setup batch screenshot pipeline that runs entirely client-side, respects crawl delays to avoid rate-limiting, and saves files straight to any chosen local directory.

## In scope (current phase)

- **Browser Tab UI:** Running the controller interface in a dedicated browser tab instead of a popup overlay.
- **Single Screenshot Capture:** One-click instant capture for active tabs, selected open tabs, or individual URLs with immediate preview, download, and clipboard copy.
- **Batch Processing:** Pasting lists of URLs with optional custom filename annotations (`[my-name]`).
- **Annotation Studio:** Built-in markup editor supporting arrows, shapes, freehand pen, text notes, highlighters, blur/redact tools, and numbered step badges with undo/redo and clipboard copy.
- **Flexible Storage:** Saving screenshots to either Chrome's default Downloads folder or a user-selected custom folder on their device (via the File System Access API).
- **Sequenced Execution:** Sequential capture with a safety wait timer between pages to prevent server bans.
- **Dynamic Load Waiting:** Extra configurable page-load timers for slow/AJAX-heavy pages.
- **Capture Modes:** Toggling between visible viewport screenshot or Full Page capture (leveraging Chrome Debugger protocol).
- **Session State Persistence:** Resuming/inspecting progress even if the extension tab is reloaded.
- **Interactive Reports:** Post-capture summary report including statistics, individual success/error logs, and CSV/JSON data export.

## Explicitly out of scope

- **Cloud Storage:** Saving captures to AWS S3, Google Cloud, or third-party screenshot hosts. (Reason: SnapIt is strictly client-side/private).
- **Captcha Bypass:** Solving cloudflare/recaptcha challenges automatically. (Reason: Out of scope; user must handle or bypass).
- **Video Capture:** Recording screen interactions or GIF generation. (Reason: Scope creep).
- **Scheduled Automated Runs:** Running captures on a recurring schedule without browser open. (Reason: Extensions must run inside an active Chrome instance).

## Success criteria

- Batch job completes 100% of valid inputs without hanging.
- Successfully writing to custom directories outside of Downloads without generating browser download prompt cascades.
- Accurate calculation and display of duration metrics and success/error status logs in the report.
