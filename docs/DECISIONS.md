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
- `Superseded by #NNNN` — replaced by a later decision
- `Deprecated` — no longer applies but no replacement

---

## 0001 — Project initialized

**Date:** 2026-07-09
**Status:** Accepted
**Context:** Project scaffolded with the project-ninja skill.
**Decision:** Establish AGENTS.md and docs/ as the source of truth for AI agent context. Cross-references owned per `references/cross-references.md` in the project-ninja skill.
**Consequences:** All AI tools (Claude Code, Antigravity, Codex, Cursor) read AGENTS.md. Decisions affecting the codebase land here.

---

## 0002 — Extension name changed to SnapIt

**Date:** 2026-07-09
**Status:** Accepted
**Context:** The project needed a catchy, memorable name that accurately describes its bulk sequential queuing nature.
**Decision:** Renamed the extension from "Mass Screenshots" to "SnapIt" in all files, manifests, titles, and headers.
**Consequences:** Manifest action default titles and HTML metadata titles reflect the new name. Codebase comments updated.

---

## 0003 — Open Extension in new tab

**Date:** 2026-07-09
**Status:** Accepted
**Context:** Popups are transient and close immediately when focus is lost (e.g. clicking outside the popup window), which interrupts bulk queues and is restricted by narrow viewport sizes.
**Decision:** Removed `default_popup` from manifest and intercepted clicks inside the service worker to open the extension as a full browser tab page. Focus existing tabs rather than creating duplicates.
**Consequences:** The application executes in a stable tab, permitting complex actions like directory picking and long-duration batch loops without risk of interruption.

---

## 0004 — Custom Directory via File System Access API

**Date:** 2026-07-09
**Status:** Accepted
**Context:** Chrome's `downloads` API restricts file savings to folders relative to the default downloads folder and generates annoying browser-specific prompt warning screens if many files are saved sequentially.
**Decision:** Implemented HTML5 File System Access API using IndexedDB to store directory handle serialization. Because background workers cannot directly access the local disk file handles in Chrome extensions, custom directory writes are sent as RPC messages from the service worker to the active extension tab to write them.
**Consequences:** Users can save screenshots directly to *any* folder on their computer, and subfolders are automatically created matching configured settings.

---

## 0005 — Post-Capture Status Report

**Date:** 2026-07-09
**Status:** Accepted
**Context:** Users had no aggregated summary of batch jobs (e.g., total run time, success counts, specific failure error details).
**Decision:** Implemented a dedicated status report section inside the controller tab, replacing the log section on completion. Calculates duration and exposes CSV/JSON download exports.
**Consequences:** Captures are highly auditable, allowing users to quickly identify which URLs failed and download/backup the run history.

---

## 0006 — Single Screenshot Capture

**Date:** 2026-08-19
**Status:** Accepted
**Context:** Users required quick one-off screenshots of a single target URL or the currently active browser tab alongside bulk batch queues.
**Decision:** Added a Single Screenshot mode switcher to the controller interface and service worker RPC handler (`CAPTURE_SINGLE`), supporting live open tab querying (`GET_OPEN_TABS`), custom single URLs, and configurable Full Page or Viewport captures with immediate preview, download, and clipboard copy.
**Consequences:** Users can capture individual pages instantly without constructing batch lists.

---

## 0007 — Zero-Dependency Canvas Annotation Studio

**Date:** 2026-08-19
**Status:** Accepted
**Context:** Users needed the ability to mark up, highlight, redact/blur, annotate with arrows/shapes/text/step badges, and copy/download annotated screenshots directly within the extension.
**Decision:** Implemented a zero-dependency HTML5 Canvas annotation studio (`AnnotationStudio` in `popup/annotation.js`) supporting vector tools (arrow, rect, ellipse, pen, text, highlighter, blur redaction, auto-incrementing step markers), history stack (undo/redo), zoom/pan, clipboard export, and custom folder saving.
**Consequences:** Complete client-side screenshot editing pipeline with no third-party dependencies, adhering to strict Manifest V3 performance and security standards.

---

## 0008 — Extension Click Action Menu & Context Menu Integration

**Date:** 2026-08-19
**Status:** Accepted
**Context:** Users wanted quick 1-click access to Single Screenshot (Full Page), Single Screenshot (Visible Area), and Batch Screenshot dashboard directly from the extension icon and right-click context menus without navigating multiple pages.
**Decision:** Added `popup/menu.html` as the extension's `default_popup` action menu and registered `chrome.contextMenus` items for fullpage capture, viewport capture, and batch dashboard access.
**Consequences:** Streamlined user interaction model: fast one-click captures straight from the browser toolbar or right-click menu, opening the dashboard tab only when deeper batch processing or markup is needed.

---

## 0009 — Annotation Studio Advanced Styling, Move/Select, and Viewport Fit

**Date:** 2026-08-20
**Status:** Accepted
**Context:** Users required greater control over canvas annotations, including viewport fit modes (Fit Width, Fit Height, Fit Screen), rich typography styling via a dedicated right-side panel, stroke dash styles, line widths, and the ability to select, move, and edit existing annotations.
**Decision:** Extended `AnnotationStudio` with custom line styles (`solid`, `dashed`, `dotted`), configurable line widths, a flyout Text Properties palette with real-time typography styling (font family, size, bold, italic, alignment, background badge), and hit-testing with interactive element translation, bounding box handles, keyboard nudging/deletion, and full undo/redo integration.
**Consequences:** Users can easily customize and reposition annotations, adjust typography in real time, and scale canvases across various screen resolutions with precision.

---

## 0010 — Menu-Driven Annotation & Single Capture Streamlining

**Date:** 2026-08-20
**Status:** Accepted
**Context:** The standalone Single Screenshot configuration card in the dashboard tab was redundant with the action popup menu. Additionally, having both a top header annotation button and a result card action created visual clutter, and the "Capture Another Page" button encouraged navigating to the obsolete configuration form.
**Decision:** Added "Annotation" as a first-class action item directly on the extension popup menu (`popup/menu.html`), removed the top header "Annotate Image" button, removed the "Capture Another Page" button from the screenshot preview screen, and eliminated the standalone single screenshot configuration card and mode switcher tabs from all flows.
**Consequences:** Single capture and annotation workflows are cleanly initiated from the extension popup menu, while the controller tab focuses purely on captured results, batch queues, and the canvas annotation studio.

---

## 0011 — Annotation Studio UI Enhancements: Text Decorations, Arrow Styles, Color Grid, Text Palette Relocation

**Date:** 2026-08-20
**Status:** Accepted
**Context:** Users required additional text formatting (underline, strikethrough), configurable arrow head styles, a better-organized color palette, and a less intrusive text properties panel that didn't consume viewport width.
**Decision:** Extended text tool with underline and strikethrough decorations (rendered on canvas via horizontal line drawing). Added 4 arrow head styles (standard filled, open chevron, line-only, double-headed) with a popover palette triggered by clicking the active arrow tool button. Restructured the color section from an inline row into a 2-row grid (4×2) with a "Color" label. Relocated the text properties panel from a 260px right-side sliding aside to a compact horizontal sub-toolbar strip below the main annotation toolbar.
**Consequences:** Richer text formatting, flexible arrow rendering, cleaner color organization, and the text palette no longer reduces canvas viewport width.

---

## 0012 — Batch Results Table Thumbnails & Dedicated Action Column

**Date:** 2026-08-20
**Status:** Accepted
**Context:** The batch capture summary report table previously combined filename output details and the annotate action button into a single column without visual screenshot thumbnail previews.
**Decision:** Integrated lightweight thumbnail generation in the background service worker using `OffscreenCanvas` and updated the batch results table to feature 6 dedicated columns: Index, Thumbnail (interactive preview with click-to-annotate), Target URL / Name, Status, Output Details (clean filename/error presentation), and Action (dedicated column with styled Annotate button).
**Consequences:** Batch capture results are immediately scannable visually, users can directly inspect or annotate captures from the table or thumbnails, and table columns are cleanly aligned.

---

## 0013 — Incremental batch-XX Subdirectory Organization for Batch Captures

**Date:** 2026-08-21
**Status:** Accepted
**Context:** Batch captures previously placed all screenshots directly into the flat `subfolder` directory, causing screenshots from distinct batch jobs to intermingle without per-job folder isolation.
**Decision:** Implemented automatic incremental subdirectory organization using the `batch-XX` pattern (e.g. `batch-01`, `batch-02`, etc.). Single one-off screenshots remain in the root `subfolder/`.
**Consequences:** Screenshots from individual batch runs are cleanly grouped into separate incremental folders across both custom directory handles and standard Chrome downloads. Annotation saves originating from batch captures preserve the batch subdirectory structure.

---

## 0014 — Directory-Driven Batch Sequence Increment (No Persisted Storage Counter)

**Date:** 2026-08-22
**Status:** Accepted
**Context:** Storing and incrementing a `lastBatchSequence` counter in `chrome.storage.local` caused batch sequence numbers to drift and accumulate across runs independently of actual directory contents (e.g., continuing to `batch-15` even if the directory was empty, folders were deleted, or destination folder changed).
**Decision:** Eliminated the persisted storage counter. Batch numbers are now dynamically derived directly from directory inspection: scanning `FileSystemDirectoryHandle` (for custom save locations) and `chrome.downloads` history (for default downloads) to find the highest existing `batch-XX` folder and picking the next sequence index.
**Consequences:** Batch folder incrementing always accurately reflects the actual files and folders on disk without stale or orphaned sequence numbers in storage data.


