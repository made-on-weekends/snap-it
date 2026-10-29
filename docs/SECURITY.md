# SECURITY.md

> Technical security architecture, threat model, and engineering hard rules. For public vulnerability disclosure and supported versions, see root [SECURITY.md](../SECURITY.md).

## Hard Rules

These rules are **absolute**. Violating any of them requires an explicit `DECISIONS.md` entry:

1. **Never** send screenshot images, URLs, or user metadata to external third-party servers. All processing and storage remain strictly local on the user's machine.
2. **Always** wrap `chrome.debugger` attachment in `try...finally` blocks to guarantee immediate detachment on any error or completion.
3. **Never** execute dynamic JavaScript strings via `eval()`, `new Function()`, or `setTimeout("string")` — strict CSP compliance is mandatory.
4. **Always** sanitize user-defined subfolder names and file templates to prevent path traversal (`../`) attacks or writing outside target directories.
5. **Never** commit secrets, API keys, or `.agents/mcp_config.json` into the Git repository.
6. **Always** validate file permissions and directory handles before attempting writes via the File System Access API.

## Permissions & Trust Boundary

SnapIt operates inside the browser with elevated extension capabilities:

- `activeTab` / `<all_urls>`: Needed to capture DOM and viewport states of targeted web pages.
- `debugger`: Required on Chromium for CDP full-page screenshot capture without sticky header duplication.
- `downloads`: Required to save screenshots to user's disk when not using File System Access handles.
- `storage`: Required for local settings and temporary batch queue state.
- `alarms`: Used for deterministic, non-drifting throttling intervals between batch captures.

## Threat Model — Top Concerns

1. **Malicious Web Page Isolation:**
   - *Threat:* A malicious website attempting to exploit content scripts or communication ports to invoke privileged extension APIs.
   - *Mitigation:* Content scripts execute in isolated worlds and only pass structured message events for coordinates and scroll metrics. The service worker strictly validates all incoming message actions.

2. **Path Traversal & Filename Injection:**
   - *Threat:* Malicious URL or custom filename pattern containing `../../` attempting to write outside designated screenshot folders.
   - *Mitigation:* All generated filenames are sanitized by stripping control characters, slashes, and path traversal sequences.

3. **Persistent Debugger Exposure:**
   - *Threat:* Service worker crashes or tab closes while `chrome.debugger` is attached, leaving an open debug session.
   - *Mitigation:* Top-level listeners on `chrome.tabs.onRemoved` automatically clean up pending debugger sessions and reset queue locks.

4. **Credential & API Key Safety:**
   - *Threat:* Accidental exposure of local development credentials or Google Stitch MCP keys.
   - *Mitigation:* `.agents/` is strictly ignored in `.gitignore`, and the build scripts exclude `.agents/` and development metadata from output packages.

## Incident Response

If a security issue is detected:
1. **Contain:** Disable affected permission or feature branch immediately.
2. **Review:** Conduct root cause analysis across `service-worker.js` and content script boundaries.
3. **Patch:** Release hotfix version and update `CHANGELOG.md`.
4. **Disclose:** Follow responsible disclosure policy in root [SECURITY.md](../SECURITY.md).
