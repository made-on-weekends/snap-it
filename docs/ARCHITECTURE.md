# ARCHITECTURE.md

> Technical structure. How the pieces fit together. Not how to use the project (see AGENTS.md).

## High-level diagram

```
   ┌──────────────────────┐        chrome.runtime       ┌────────────────────────┐
   │                      │      (START/STOP_CAPTURE)   │                        │
   │     popup.html       │ ──────────────────────────> │   service-worker.js    │
   │                      │ <────────────────────────── │                        │
   │  (Controller Page)   │    chrome.storage.session   └────────────────────────┘
   │                      │        (captureState)             │            │
   └──────────────────────┘                                   │            │
        │            ▲                                        │            │
IndexedDB  chrome.tabs.onMessage                              │            │ chrome.tabs.create
  (Read)        (SAVE_CUSTOM_SCREENSHOT)                      │            │ (Target Web Pages)
        │            │                                        ▼            ▼
        ▼            │                                   ┌────────┐   ┌────────┐
   ┌──────────────────┐                                  │ Target │   │ Target │
   │  storage-helper  │                                  │ Tab #1 │   │ Tab #2 │
   └──────────────────┘                                  └────────┘   └────────┘
        │
    FileSystemAccess
        ▼
   Local Disk (Custom Output Folder)
```

## Layers

### 1. Controller Layer (Tab Interface)
- **Files:** [popup.html](file:///mnt/workbench/repos/live/snap-it/popup/popup.html), [popup.css](file:///mnt/workbench/repos/live/snap-it/popup/popup.css), [popup.js](file:///mnt/workbench/repos/live/snap-it/popup/popup.js), [settings.html](file:///mnt/workbench/repos/live/snap-it/settings/settings.html), [settings.css](file:///mnt/workbench/repos/live/snap-it/settings/settings.css), [settings.js](file:///mnt/workbench/repos/live/snap-it/settings/settings.js)
- **Role:** Renders the main user dashboard (runs as a tab page, not a popup) and the options/settings page. Handles URL parsing, settings adjustments, folder configuration, live logs, progress feedback, and post-capture report metrics + data export (CSV/JSON).

### 2. Orchestration Layer (Background)
- **Files:** [service-worker.js](file:///mnt/workbench/repos/live/snap-it/service-worker.js)
- **Role:** A background service worker that acts as the capture orchestrator. It manages sequential queue alarms, controls the creation and termination of capture tabs, handles Chrome Debugger CDP connections, and drives the capture process.

### 3. File System Layer
- **Files:** [storage-helper.js](file:///mnt/workbench/repos/live/snap-it/storage-helper.js)
- **Role:** Provides IndexedDB storage access for serializing and retrieving `FileSystemDirectoryHandle` objects. Implements permission negotiation and recursive, directory-aware file writing to local folders.

---

## Capture Lifecycle

```
1. User enters URLs in popup.html and clicks "Start Capture".
2. popup.js verifies custom folder handle and permissions (if configured).
3. popup.js sends "START_CAPTURE" message to service-worker.js.
4. service-worker.js sets captureState in chrome.storage.session (e.g. status: 'running').
5. Loop:
   a. Create target URL in new tab (active: false).
   b. Wait for page load trigger ('complete' event) + extra delay (settings.pageWait).
   c. If mode is "fullpage":
      i. Attach chrome.debugger.
      ii. Fetch Page.getLayoutMetrics to calculate scroll height.
      iii. Override device metrics to full height and call Page.captureScreenshot.
      iv. Detach chrome.debugger.
   d. If mode is "viewport":
      i. Focus tab and captureVisibleTab.
   e. Save File:
      i. Default: Call chrome.downloads.download.
      ii. Custom: Send "SAVE_CUSTOM_SCREENSHOT" to controller tab to write to disk.
   f. Close target tab.
   g. Log results and update session storage results array.
   h. Wait for delay timer (via chrome.alarms).
6. Queue is exhausted -> service-worker.js updates status to "completed" in storage.
7. popup.js detects change, hides input and progress divs, and renders the Status Report.
```

## Shared State Model

Extension components share live capture state using Chrome's **Session Storage** (`chrome.storage.session`). The service worker is the primary writer of this state:
- `captureState`:
  - `status`: `'running' | 'waiting' | 'completed' | 'stopped' | 'error'`
  - `jobs`: List of input URLs.
  - `currentIndex`: Index of active URL.
  - `completed`: Counter of completed captures.
  - `total`: Total jobs in queue.
  - `results`: Array of objects tracking URL, name, success status, file paths, error messages, and execution timestamps.
  - `startTime` / `endTime`: Execution epoch timestamps for duration calculation.

## Core Design Decisions

- **Decoupled Writes:** The service worker cannot access File System Access directory pickers directly. Therefore, disk writes for custom paths are sent as RPC messages to the tab page.
- **Tab Focus Containment:** Viewport capture requires the tab to be active, causing brief flashes. Full Page capture uses debugger overrides in the background, keeping the workflow non-intrusive.
