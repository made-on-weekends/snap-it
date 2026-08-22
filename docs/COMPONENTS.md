# COMPONENTS.md

> UI components inventory and structural rules for the SnapIt Chrome Extension.

## Component conventions

- **Location**: HTML components are structured inside the main controller template [popup.html](file:///mnt/workbench/repos/live/snap-it/popup/popup.html) and settings template [settings.html](file:///mnt/workbench/repos/live/snap-it/settings/settings.html).
- **Styling**: Component styles are declared using Vanilla CSS custom properties (design tokens) inside [popup.css](file:///mnt/workbench/repos/live/snap-it/popup/popup.css) and [settings.css](file:///mnt/workbench/repos/live/snap-it/settings/settings.css).
- **Behavior bindings**: Driven by JavaScript files [popup.js](file:///mnt/workbench/repos/live/snap-it/popup/popup.js) and [settings.js](file:///mnt/workbench/repos/live/snap-it/settings/settings.js), bound during `DOMContentLoaded`.

## State ownership

- **Persistent Configuration**: Saved in Chrome's Sync Storage (`chrome.storage.sync`) under the `settings` key. Managed primarily by [settings.js](file:///mnt/workbench/repos/live/snap-it/settings/settings.js) and loaded in [popup.js](file:///mnt/workbench/repos/live/snap-it/popup/popup.js) to configure the capture session.
- **Active Capture Status**: Managed inside Chrome's Session Storage (`chrome.storage.session`) under `captureState`. Shared between the background service worker and the controller page to synchronize progress bars and capture metrics.
- **Directory Access Handle**: Saved in IndexedDB via [storage-helper.js](file:///mnt/workbench/repos/live/snap-it/storage-helper.js) for quick re-negotiation of permissions.

## Component inventory

### 1. Navigation Mode Switcher (`.mode-tabs`)
- **Purpose**: Switches between Single Screenshot mode and Batch Capture mode.
- **Markup**: `#tab-single` and `#tab-batch`.
- **Logic**: Toggles view sections and stores preference in `chrome.storage.local`.

### 2. Single Capture Card (`#single-section`)
- **Purpose**: Configure and trigger single-page screenshot captures.
- **Markup**: Target radios (Active Tab, Custom URL, Open Tab dropdown), capture mode toggle, optional name input, and `#single-capture-btn`.
- **Logic**: Dispatches `CAPTURE_SINGLE` to service worker and displays instant preview in `#single-result-card`.

### 3. Single Result Preview Card (`#single-result-card`)
- **Purpose**: Displays the newly captured screenshot preview with quick markup, download, and copy actions.
- **Markup**: Thumbnail image, status badge, `#single-annotate-btn`, `#single-copy-btn`, and `#single-download-btn`.

### 4. URL Input Card (`.input-section`)
- **Purpose**: Pasteboard for capture URLs, displaying live parsed counts.
- **Markup**: Contains `<textarea>` and `.url-count`.
- **Logic**: Parsed on every input event by `popup.js` `parseUrls()` utility.

### 5. Control Toolbar (`.controls`)
- **Purpose**: Action buttons to launch or stop the capture queue.
- **Markup**: `#start-btn` (Primary) and `#stop-btn` (Danger).
- **Logic**: Starts or interrupts the capture session by sending messages to the background worker.

### 6. Folder Alert Banner (`#custom-folder-indicator`)
- **Purpose**: Warns the user when a custom output path is selected but no directory handle is currently loaded or authorized.
- **Markup**: Contains a warning sign and `#fix-folder-btn`.

### 7. Progress Card (`#progress-section`)
- **Purpose**: Live feedback interface during active runs.
- **Markup**: Includes the `#progress-status` badge, `#progress-bar` track, and the `#log-container` console log.

### 8. Report Table Dashboard (`#report-section`)
- **Purpose**: Displays the completed capture summary with screenshot thumbnail previews and separate action triggers.
- **Markup**: Four stat cards (`.stat-card`), export action buttons, and `.report-table` with dedicated columns for index, thumbnail preview (`.table-thumb-wrapper`), target URL/name, status badge, output details (filename/error), and separate action column (`.table-action-btn`).
- **Logic**: Handles file exports (CSV/JSON), item links, click-to-annotate thumbnail previews, and dedicated "Annotate" triggers for captured URLs.

### 9. Annotation Studio Modal (`#annotation-modal`)
- **Purpose**: Full-featured markup studio for drawing, adding text/arrows/shapes/step markers, blurring sensitive content, and copying/saving.
- **Markup**: `#annotation-toolbar` (tools, color swatches, stroke sizes, undo/redo, zoom, save/copy) and `#annotation-viewport`.
- **Logic**: Powered by `AnnotationStudio` in [annotation.js](file:///mnt/workbench/repos/live/snap-it/popup/annotation.js).

