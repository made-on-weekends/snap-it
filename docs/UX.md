# UX.md

> Interaction flows, user states, keyboard shortcuts, and behavioral rules.

## Core Interaction Flows

### 1. Instant Viewport Capture
1. User activates extension via keyboard shortcut (`⌘ + ⇧ + 2` / `Ctrl + Shift + 2`) or clicks "Capture Viewport" in the action menu.
2. Extension captures the active tab's visible window instantly without injecting DOM elements.
3. Depending on user preference in Settings:
   - Opens screenshot directly in the Annotation Studio, or
   - Saves file immediately to the chosen folder with a confirmation toast.

---

### 2. Full-Page Scrolling Capture
1. User triggers Full Page capture (`⌘ + ⇧ + 1` / `Ctrl + Shift + 1`).
2. Extension attaches `chrome.debugger` to the active tab. Chromium shows a brief, native debugging banner.
3. Extension retrieves full document layout height via CDP, sets emulation metrics, and captures the complete bitmap.
4. Debugger detaches immediately in all execution paths (`finally` block).
5. Image is loaded into the Annotation Studio canvas.

---

### 3. Sequential Batch Queue Capture
1. User navigates to the Batch Queue dashboard (`⌘ + ⇧ + 3` / `Ctrl + Shift + 3`).
2. User enters one or more URLs into the batch input area.
3. User selects capture format, quality, and inter-capture delay (to allow complex client-side applications to hydrate).
4. User clicks "Start Batch Capture":
   - Progress bar updates with each processed URL.
   - Live thumbnails populate the results list.
   - Files are automatically saved to disk (via File System Access API or download queue).
5. Any individual capture can be clicked to open in the Annotation Studio for immediate markup.

---

### 4. Canvas Annotation & Export
1. User selects a tool using hotkeys (`V`, `K`, `A`, `R`, `C`, `P`, `T`, `H`, `B`).
2. User clicks and drags on the canvas to draw shapes or notes:
   - Every shape renders with an automatic 1.5px contrasting halo outline so it is legible on both light and dark web pages.
   - Redactions draw as solid opaque blocks (`#14171C`), irreversibly obscuring credentials.
3. User presses `Ctrl + Z` to undo or `Ctrl + Y` to redo at any time.
4. User clicks "Copy to Clipboard" for fast pasting into Slack, GitHub, or Jira, or "Download" to export the final composited image.

---

## Behavioral Rules

### Do:
- **Quiet, predictable actions:** Use verb-first UI copy ("Capture region", "Copied to clipboard", "Saving batch...").
- **Automatic cleanup:** Always detach `chrome.debugger` immediately upon completion or failure.
- **Maintain aspect ratio:** Canvas zoom operations must preserve bitmap pixel ratios and center around cursor focus.
- **Provide clear error recovery:** If a tab cannot be captured (e.g. `chrome://` internal URLs where extensions are blocked by Chromium policy), show an explicit, helpful toast explaining why.

### Don't:
- **No intrusive page overlays:** Do not inject floating capture frames into target web pages that alter page CSS or trigger responsive layout shifts.
- **No lossy pixelation for redaction:** Never offer blur/pixelation redaction modes that give a false sense of security.
- **No unexpected downloads:** Respect the user's configured automatic vs manual download preferences.
