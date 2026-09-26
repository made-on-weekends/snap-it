# Reporting Issues & Feature Requests

We appreciate your help in making SnapIt better! Whether you found a bug, ran into a layout problem, or want to suggest a new feature, your feedback is invaluable.

This guide outlines how to submit reports that can be triaged and resolved as quickly as possible.

---

## 🔍 Quick Checklist Before Submitting

To avoid duplicate work and resolve issues faster, please complete these steps before creating a new issue:

1. **Search Existing Issues**: Check active and closed issues in the [GitHub Issue Tracker](https://github.com/made-on-weekends/snap-it/issues) to see if someone else has already reported the problem.
2. **Update to Latest Version**: Verify that you are running the latest version from `master`.
3. **Verify Chromium Permissions**: Check that required permissions (`debugger`, `downloads`, `storage`) have not been revoked in `chrome://extensions`.

---

## 🐛 How to Report a Bug

To help us diagnose and fix the bug quickly, please include the following details in your report:

> [!IMPORTANT]
> The more detailed and reproducible your report is, the faster we can fix it.

### 1. Clear Summary
Provide a concise title that describes the issue clearly (e.g., *"Full-page capture fails on sticky navigation with z-index 9999"* instead of *"Capture doesn't work"*).

### 2. Steps to Reproduce
List the exact steps someone else can follow to experience the issue:
1. Open tab '...'
2. Trigger shortcut '⌘ + ⇧ + 1'
3. Notice behavior '...'

### 3. Expected vs. Actual Behavior
- **Expected Behavior**: What you expected to happen.
- **Actual Behavior**: What actually happened (include error messages, background service worker console stack traces, or logs).

### 4. Screenshots
Visuals are extremely helpful for UI, layout, or canvas annotation issues. Attach screenshot comparisons directly to the issue.

### 5. System Environment
Include relevant details about the environment you are running:
- **Operating System**: (e.g., macOS Sonoma, Windows 11, Ubuntu 24.04)
- **Browser**: (e.g., Google Chrome v131, Brave v1.73, Chromium v131)
- **Extension Version**: (e.g., 1.0.0 or commit hash)

---

## 💡 How to Request a Feature

If you have an idea for a new feature or improvement, feel free to open a feature request on GitHub:

- **Problem Statement**: Describe the problem you are trying to solve or the workflow friction you face.
- **Proposed Solution**: Explain how you think the new feature should work.
- **Alternatives Considered**: Any alternative workarounds or designs you considered.
- **Context/Value**: Explain how this feature will benefit you and other users.

---

## 🔒 Reporting Security Issues

> [!CAUTION]
> Do NOT report security vulnerabilities on the public issue tracker.

If you discover a security vulnerability, please follow our responsible disclosure policy outlined in [SECURITY.md](SECURITY.md) or email security@adommo.com directly.

---

## ⏱️ What Happens Next?

Once submitted:
1. **Triaging**: Maintainers will review the issue to classify it and verify reproducibility.
2. **Discussion**: We may ask clarifying questions or request additional background console logs.
3. **Resolution**: Once verified, a fix will be scheduled for development and released in a subsequent update.

Thank you for your cooperation and collaboration!
