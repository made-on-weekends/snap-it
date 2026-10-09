# SECURITY.md

> Technical security architecture, threat model, and engineering hard rules.
> For public vulnerability disclosure policy and supported versions, see root [SECURITY.md](../SECURITY.md).

## Hard Rules

These rules are **absolute**. Violating any of them requires an entry in `docs/DECISIONS.md`.

1. **Never** transmit captured screenshot pixels, DOM contents, or user data to external servers or remote endpoints. All processing remains strictly local.
2. **Never** use `eval()`, `new Function()`, or dynamic string execution in any extension context.
3. **Never** weaken the default Manifest V3 Content Security Policy (`script-src 'self'`).
4. **Never** inject unvalidated remote code into web pages. All injected content scripts must be local assets declared within the extension bundle.
5. **Never** log captured image payloads or base64 data URLs to console logs in production builds.
6. **Never** commit API credentials, personal keys, or private tokens to Git.

## Extension permissions inventory

| Permission | Purpose & Least Privilege Scope |
|---|---|
| `activeTab` | Temporary interaction with the frontmost tab to capture viewport or crop bounds. |
| `tabs` | Creating and closing sequential tabs during bulk URL capture queues. |
| `scripting` | Programmatically injecting the area selection overlay (`content/area-selector.js`). |
| `storage` | Storing user preferences (`storage.local`) and transient batch queue state (`storage.session`). |
| `alarms` | Background timer alarms to schedule delays between queued URL captures without holding wake locks. |
| `downloads` | Saving captured PNG, JPEG, or WebP files to the user's Downloads directory. |
| `debugger` | Invoking Chrome DevTools Protocol (`Page.captureScreenshot`) for automated full-page scrolling captures. |
| `contextMenus` | Context menu triggers for quick screenshot actions. |
| `<all_urls>` | Required host permission to capture and inject selector overlays on user-requested websites. |

## Content Security Policy (CSP)

SnapIt enforces the standard Manifest V3 CSP:
```
script-src 'self'; object-src 'self'
```
No inline JavaScript is permitted in extension HTML pages. All event listeners are attached programmatically from external scripts.

## Threat model — top concerns

1. **Cross-Tab / Malicious Page Exploitation:**
   - *Risk:* A malicious web page attempts to communicate with the extension background worker or access Chrome APIs.
   - *Mitigation:* Extension messaging uses internal `chrome.runtime.onMessage` listeners validating message actions. External connections (`externally_connectable`) are disabled.
2. **Untrusted DOM Content Injection:**
   - *Risk:* Web content manipulates the area selector overlay or injects malicious DOM nodes into the editor canvas.
   - *Mitigation:* `content/area-selector.js` uses isolated Shadow DOM or minimal inline styles without executing external scripts.
3. **Image Data Leakage:**
   - *Risk:* Leaking screenshots containing passwords, emails, or personal data.
   - *Mitigation:* Zero outbound network requests. Native downloads API and Clipboard API keep data local to the machine.
