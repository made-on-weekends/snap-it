# UX.md

> User flows and behavior rules for the SnapIt Chrome Extension.

## Core flows

### 1. Launching the Extension
- The user clicks the SnapIt extension icon in the Chrome toolbar.
- The background service worker intercepts the click, queries for existing SnapIt tabs, and either focuses an existing controller tab or opens [popup.html](file:///mnt/workbench/repos/live/snap-it/popup/popup.html) in a new tab.

### 2. Setting Up a Capture Session
- The user enters a list of URLs in the main textarea.
- The textarea updates the URL count dynamically as the user types.
- If the user selects "Custom" output directory in settings, the UI checks if a directory handle exists.
  - If no handle exists, an alert bar is shown prompting the user to select a folder.
  - If the user clicks "Start Capture" without a folder selected, a folder picker is launched.

### 3. Capture Loop & Progress Feedback
- Upon clicking "Start Capture", the input section is hidden and the Progress section is shown.
- The Progress section displays:
  - Active status badge (Processing, Waiting, Stopped, Completed).
  - Progress bar tracking percentage completion.
  - Numerical counter (e.g., `3 / 10`).
  - Active URL being captured.
  - Live log console appending new log messages.
- The "Stop" button is enabled to allow interrupting the process.

### 4. Post-Capture Report
- Once complete or stopped, the progress section hides and the Report section appears.
- It displays:
  - Aggregate statistics (Total URLs, Success Count, Failed Count, total Duration).
  - Action buttons to download the report as CSV or JSON.
  - Detailed status table listing each URL, status badge, and filename or error message.
- Dismissing the report returns the user to the URL input screen.

## Always / Never Rules

**Always:**
- Always show a clear error message in the log console when a URL fails to load or capture.
- Always preserve the user's pasted URLs inside the text box even if the page is refreshed (persisted in `chrome.storage.local`).
- Always show the live logs so the user knows the background process is running.
- Always clean up temporary tabs opened during the capture process.

**Never:**
- Never wipe out the URL list upon capture completion (allow users to re-run or edit).
- Never block the UI; all actions must run asynchronously.
- Never use modal `confirm()` prompts; use styled inline banners and status logs.

## Form validation

- **URL Detection**: Parsed line-by-line using regex matching. Any line that is not a valid HTTP/HTTPS URL is skipped.
- **Errors**: Displayed directly in the live log console with a red "✗" mark.

## Loading thresholds

- Delays between page loads are configurable (e.g., `15` seconds) to prevent rate limits. A yellow "Waiting" status badge and a delay log is shown during this time.
