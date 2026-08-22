# TESTING.md

> Testing strategy and manual verification procedures for the SnapIt Chrome Extension.

## Test stack & commands

Since this is a client-side Chrome Extension interacting heavily with Chrome Extension APIs (debugger, tabs, downloads) and the browser filesystem, testing is primarily focused on JavaScript syntax validation and manual browser verification.

### Syntax Validation Command
Before committing any changes, run the syntax check to ensure there are no JavaScript syntax errors:
```bash
node -c storage-helper.js service-worker.js popup/popup.js settings/settings.js
```

## Manual verification checklist

Always test changes manually in a clean Google Chrome developer environment.

### 1. Installation & Reload Flow
- Navigate to `chrome://extensions/`
- Click **Load unpacked** and select the root folder.
- Ensure the extension loads without error flags.
- Verify clicking the toolbar icon successfully focuses or creates the extension tab page.

### 2. Basic Capture Flow (Downloads)
- Ensure settings are set to **Downloads** folder (`saveLocation: "downloads"`).
- Paste a URL: `https://example.com [example-test]`
- Click **Start Capture**.
- Verify:
  - Tab opens in the background.
  - Progress bar advances to 100%.
  - Tab closes.
  - Screenshot file is successfully saved to the default Downloads folder inside a `screenshots/` directory (e.g., `screenshots/example-test_YYYY-MM-DD-HH-MM-SS.png`).

### 3. Full Page vs Viewport Capture
- Toggle Capture Mode in settings between **Full Page** and **Viewport**.
- Capture a long scrolling page (e.g. `https://github.com`).
- Verify:
  - Full Page mode captures the entire height.
  - Viewport mode captures only the visible region.

### 4. Custom Folder Write Flow (IndexedDB & FileSystem Access)
- Configure settings to **Custom** folder destination.
- Click **Start Capture** (or click **Select Folder** in the warning banner).
- Grant permission in the browser directory prompt.
- Verify files are written directly to the chosen local directory without triggering standard browser download window popups.
