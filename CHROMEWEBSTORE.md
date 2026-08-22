# Chrome Web Store Listing — SnapIt

> Last Updated: 2026-07-11

## Store Listing

**Extension Name**
SnapIt - Bulk Batch Screenshot Capture

**Short Description**
Bulk capture full-page screenshots from a list of URLs with crawl delays, sequential queues, and custom save destinations.

**Detailed Description**
SnapIt is the ultimate bulk website screenshot utility built specifically for web developers, QA testers, designers, and SEO marketers. Instead of manually navigating, capturing, and saving pages one by one, SnapIt lets you paste a queue of URLs and capture them all in a single automated batch run.

Features:
- Dedicated Browser Tab Page: Runs in a stable browser tab to prevent the process from being interrupted when you click elsewhere.
- Sequenced Captures & Crawl Delays: Configurable delay timers between page captures to prevent your IP from being rate-limited or banned.
- Viewport or Full Page Capture: Seamlessly toggle between viewport-only screenshots or full-height page captures utilizing the Chrome DevTools debugger layout overrides.
- Flexible Storage: Save captures directly to Chrome's default Downloads folder or pick any custom directory on your local machine using the File System Access API.
- Live Logging & Progress: Watch progress percentage, active URLs, and status logs in real-time.
- Interactive Reports: Access a complete summary dashboard detailing success/failure rates, duration metrics, and download the report as CSV or JSON.

How to use:
1. Click the SnapIt extension icon in your toolbar to open the control dashboard tab.
2. Paste your list of target URLs (one per line, with optional custom filenames inside brackets like `https://example.com [example-homepage]`).
3. Click the Settings gear icon to configure delay, capture mode, wait timers, and output directory.
4. Click "Start Capture" and let the extension process the queue. Download the report when finished.

Privacy Note:
SnapIt runs 100% locally. We do not transmit your URLs, logs, or captured images to any remote servers. Your data stays entirely on your local machine.

**Category**
Developer Tools (or Productivity)

**Single Purpose**
Bulk captures full-page and viewport screenshots from a user-provided list of URLs sequentially.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 (Dashboard) | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 (Settings) | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 (Report) | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
- **Screenshot 1**: Show the main SnapIt dashboard tab with URLs pasted into the textarea, the custom folder indicator, and the "Start Capture" button.
- **Screenshot 2**: Show the options/settings page with sliders for wait delay, capture formats (PNG/JPEG), capture mode toggles, and folder selection.
- **Screenshot 3**: Show the completion screen featuring the stats cards (Total, Success, Failed, Duration), the detailed results table with success badges, and the CSV/JSON export actions.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `tabs` | permissions | Required to programmatically create background tabs to load target URLs, query if a controller tab is already open, and close tabs after capture. |
| `debugger` | permissions | Required to interact with the Chrome DevTools Protocol (CDP) to override device metrics (deviceScaleFactor, full heights) to capture accurate full-page screenshots. |
| `downloads` | permissions | Required to download and save captured screenshot images to the default Chrome downloads folder when custom directories are not configured. |
| `storage` | permissions | Required to persist user settings (`chrome.storage.sync`) and track the active capture queue state (`chrome.storage.session`) across background context restarts. |
| `alarms` | permissions | Required to schedule reliable delay timers between capturing individual URLs, preventing rate limits and extension service worker termination. |
| `activeTab` | permissions | Required to capture active viewport screenshots of target tabs. |
| `<all_urls>` | host_permissions | Required to access and capture screenshots of any web address entered by the user in the batch queue. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
https://adommo.com/privacy/snap-it

*(Alternatively, host a simple privacy policy on your website or GitHub Pages stating that all operations are performed 100% locally and no user data is collected or transmitted.)*

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name**
Adommo LLC

**Contact Email**
support@adommo.com

**Support URL / Email**
https://github.com/made-on-weekends/snap-it/issues

**Homepage URL**
https://adommo.com

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-07-11 | Initial release with sequential batch queue, full-page/viewport support, custom directory storage, and CSV/JSON reporting. | Draft |
