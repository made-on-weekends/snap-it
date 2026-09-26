# SECURITY.md

> Technical threat model, hard security rules, and engineering boundaries.
> For responsible disclosure and public reporting policies, see root [SECURITY.md](../SECURITY.md).

## Hard Security Rules

1. **Local-Only Processing:** Never transmit captured images, page URLs, batch lists, or user annotations to external servers. All operations must occur purely inside the local browser sandbox.
2. **Strict CDP Scoping:** The `chrome.debugger` API must ONLY be attached to tabs explicitly targeted by the user for screenshot capture. Never execute arbitrary JavaScript strings via `Runtime.evaluate` on third-party pages.
3. **Guaranteed Debugger Detachment:** Every `chrome.debugger.attach` call must be wrapped in a `try...finally` block that invokes `chrome.debugger.detach(target)` to prevent lingering debugging hooks.
4. **Destructive Redaction:** Canvas redaction must be performed via destructive, opaque solid fills (`#14171C`). Never implement mathematical blurs, pixelation filters, or mosaic patterns, as these can be reversed using de-convolution or neural reconstructions.
5. **No Remote Code Execution (Manifest V3 CSP):** Never load external scripts, analytics libraries, remote fonts, or dynamic `eval()` execution. All assets (fonts, icons, logic) must be vendored and bundled within the extension package.
6. **File System Access Boundaries:** Directory handles requested via `showDirectoryPicker` must only be used to write user-initiated image files and batch manifests.

---

## Threat Model & Mitigations

### 1. Chrome DevTools Protocol (`debugger` permission)
- **Threat:** Malicious code with debugger access could inspect DOM state, extract cookies/tokens, or control tab execution.
- **Mitigation:**
  - Scope is strictly constrained to `Page.enable`, `DOM.enable`, `Page.getLayoutMetrics`, `Emulation.setDeviceMetricsOverride`, and `Page.captureScreenshot`.
  - Zero extraction of cookies, DOM storage, network request bodies, or user keystrokes.
  - The extension is fully open-source with verifiable buildless vanilla code.

### 2. PII & Sensitive Credential Leakage in Screenshots
- **Threat:** Users capturing web dashboards may accidentally include API keys, passwords, or personal data in screenshots shared with third parties.
- **Mitigation:**
  - SnapIt provides a dedicated Redact tool (`B`) that completely replaces canvas pixel data with an opaque solid color before export.
  - Exported data URLs and files contain only the flattened, post-redacted image composite.

### 3. File Overwrite / Directory Traversal
- **Threat:** Bulk batch capture queues could attempt to write files outside designated download directories using malicious filename tokens.
- **Mitigation:**
  - Filenames generated from page titles or URL parameters are strictly sanitized, stripping path traversal sequences (`../`, `..\`), null bytes, and illegal filesystem characters (`/ \ : * ? " < > |`).

### 4. Content Script & DOM Injection
- **Threat:** Malicious target pages could exploit extension content scripts to escalate privileges or access extension APIs.
- **Mitigation:**
  - SnapIt does not use persistent content scripts or DOM messaging relays.
  - Tab interactions occur via isolated background service worker commands and CDP protocols.
