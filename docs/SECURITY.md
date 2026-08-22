# SECURITY.md

> Security rules and threat model for the SnapIt Chrome Extension.

## Hard Rules

These rules are **absolute**. Violating any of them requires a `DECISIONS.md` entry that explicitly supersedes the rule, with security review. The rules listed here are not the project's complete security posture — they are the floor below which behavior is considered a defect.

1. **Never** log URL content, sensitive cookies, session tokens, or credentials captured during screenshots.
2. **Never** use `eval()` or dynamically execute remote scripts. All code must be packaged and run inside the extension sandbox.
3. **Never** write to arbitrary file locations. All writes must be routed strictly through `chrome.downloads` (sandboxed downloads folder) or a user-consented directory handle managed via the File System Access API.
4. **Never** request directory permissions (read/write) without a direct user gesture (e.g. clicking "Start Capture" or "Select Folder").
5. **Always** sanitize filenames to prevent path traversal attacks (e.g., stripping `../` or invalid file characters).
6. **Always** detach the `chrome.debugger` immediately after capture, ensuring debugger active banners are cleared.

## Authentication & Authorization

- **Extension Authentication**: None. Runs entirely local in the user's browser context.
- **Access Control**: Relies on Chrome Extension API permissions defined in `manifest.json`.
  - `activeTab` & `<all_urls>`: Restricts tab scraping and screenshots only to URLs inputted by the user.
  - `debugger`: Allows viewport adjustments and full-page capture via DevTools Protocol (CDP).
  - `downloads`: Allows saving files to the system downloads folder.

## Secrets management

- **Secrets**: SnapIt has no client secrets or API keys. It does not communicate with external cloud databases.

## Sensitive data inventory

SnapIt does not store or transmit user data. Captured screenshots are written directly to local disk.
- **URL Input List**: Temporarily stored in `chrome.storage.local` to restore the textbox state.
- **Capture Log History / Results**: Temporarily stored in `chrome.storage.session` and cleared when the user closes the report or restarts the extension.

## Content Security Policy (CSP)

- SnapIt uses Manifest V3's default strict CSP:
  - No remote script execution is permitted.
  - No `unsafe-eval` is allowed.
  - Stylesheet connections are restricted to local extension CSS or Google Fonts link anchors.

## Threat model — top concerns

1. **Path Traversal via Filename Annotations** — A malicious URL or filename annotation like `../../../etc/passwd` could attempt to write files outside the intended subfolder.
   - *Mitigation*: Filenames are strictly sanitized using a regex pattern that strips invalid characters and replaces separator sequences with underscores.
2. **Unauthorized Debugger Attachment** — A compromised extension tab could try to hook arbitrary tabs.
   - *Mitigation*: The debugger is only attached to tabs created directly by the background service worker for processing the queue, and is detached immediately.
3. **Persistent File Access Exposure** — Directory handles left open could allow malicious tabs to write data.
   - *Mitigation*: Permissions must be explicitly re-negotiated/approved by the user upon restart if Chrome revokes the permission token.
