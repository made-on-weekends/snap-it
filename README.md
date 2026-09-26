<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/svg/logo-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="assets/svg/logo-light.svg" />
    <img src="assets/svg/logo-dark.svg" width="100%" alt="SnapIt" />
  </picture>
  <br />
  <p><strong>High-fidelity Chrome screenshot capture & canvas annotation studio.</strong></p>
  <p>Capture single viewports, scrollable full-page screenshots via Chrome DevTools Protocol, and sequential bulk URL queues with zero external cloud dependencies.</p>
</div>

---

## ⚡ Features

- **Full-Page Scrolling Capture:** Uses Chrome DevTools Protocol (`Page.captureScreenshot`) for pixel-perfect full-height page renders without breaking sticky navigation or floating headers.
- **Visible Viewport Capture:** Instant capture of the currently visible tab area.
- **Bulk URL Queue:** Feed a list of URLs with custom delays, label prefixes, and automatic sequential capturing.
- **Integrated Canvas Annotation Studio:**
  - Tools: Select/Move (`V`), Crop (`K`/`X`), Arrow (`A`), Rectangle (`R`), Ellipse (`C`), Freehand Pen (`P`), Text Notes (`T`), Highlighter (`H`), and Redact (`B`).
  - **Permanent Redaction:** Solid, destructive opaque fills (`#14171C`) that prevent reverse-engineering sensitive data.
  - **Contrasting Halos:** 1.5px contrasting halo outlines around all drawn shapes to guarantee legibility against light or dark web pages.
  - Full Undo / Redo history stack.
- **Local-First Privacy:** 100% client-side operation with File System Access API integration and automatic folder saving.
- **Dual Theme Support:** Calibrated Light and Dark modes conforming to the SnapIt design system.

---

## 🚀 Installation

1. Clone or download this repository:
   ```bash
   git clone git@github.com:made-on-weekends/snap-it.git
   ```
2. Open Google Chrome (or any Chromium-based browser) and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the repository root folder (`snap-it`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘ + ⇧ + 1` / `Ctrl + Shift + 1` | Capture full scrollable page |
| `⌘ + ⇧ + 2` / `Ctrl + Shift + 2` | Capture visible viewport |
| `⌘ + ⇧ + 3` / `Ctrl + Shift + 3` | Open batch queue dashboard |
| `⌘ + ⇧ + 4` / `Ctrl + Shift + 4` | Open annotation studio |
| `V` | Select & move tool |
| `K` / `X` | Crop tool |
| `A` | Arrow tool |
| `R` | Rectangle tool |
| `C` | Circle / Ellipse tool |
| `P` | Freehand pen |
| `T` | Text note |
| `H` | Highlighter |
| `B` | Redact tool |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |

---

## 📁 Project Structure

```text
snap-it/
├── manifest.json         # Manifest V3 extension configuration
├── service-worker.js     # Background service worker (CDP capture orchestrator)
├── storage-helper.js     # Storage and File System Access API helper
├── popup/
│   ├── menu.html         # Quick action dropdown menu
│   ├── menu.js           # Action menu controller
│   ├── menu.css          # Action menu styling
│   ├── popup.html        # Main dashboard and annotation studio
│   ├── popup.js          # Dashboard & batch queue controller
│   ├── popup.css         # Dashboard and studio styling
│   └── annotation.js     # Canvas annotation engine
├── settings/
│   ├── settings.html     # Extension options & preferences page
│   ├── settings.js       # Settings controller
│   └── settings.css      # Settings styling
├── icons/                # Extension action icons (16px, 32px, 48px, 128px)
├── assets/               # Brand SVGs, webfonts, favicons, and promo assets
└── docs/                 # Technical specifications and design system
```

---

## 🔒 Permissions

- `debugger`: Captures high-resolution, full-page screenshots via Chrome DevTools Protocol (`Page.captureScreenshot`).
- `tabs` & `activeTab`: Targets browser tabs for capture.
- `downloads`: Saves captures and batch reports to disk.
- `storage`: Persists user options and custom directory preferences.
- `alarms`: Manages delay intervals between batch URL captures.
- `scripting`: Detects document dimensions and scroll heights.
- `<all_urls>`: Allows captures across arbitrary user-specified URLs.

---

## 📚 Documentation

For technical details, project guidelines, and development context:

- 🤖 **For AI Coding Agents:** Refer to [AGENTS.md](AGENTS.md) for development commands, project conventions, and agent instructions.
- 🏗️ **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system structure, major components, and data flows.
- ⚖️ **Decision Log:** See [docs/DECISIONS.md](docs/DECISIONS.md) for architectural decisions, rationale, and established conventions.
- 🎯 **Product Scope:** See [docs/PRODUCT.md](docs/PRODUCT.md) for product goals, supported features, and planned work.
- 🛡️ **Security Guidelines:** See [docs/SECURITY.md](docs/SECURITY.md) for technical threat models, and [SECURITY.md](SECURITY.md) for public disclosure policies.
- 🧪 **Testing Strategy:** See [docs/TESTING.md](docs/TESTING.md) for test coverage, commands, and verification procedures.
- 🧩 **UI Components:** See [docs/COMPONENTS.md](docs/COMPONENTS.md) for component rules and layout inventories.
- 🎨 **Design System:** See [docs/DESIGN.md](docs/DESIGN.md) for design tokens, typography, and color palettes.
- 🏷️ **Brand Identity:** See [docs/BRAND.md](docs/BRAND.md) for brand voice, naming, and logo guidelines.
- 🧭 **User Experience:** See [docs/UX.md](docs/UX.md) for interaction flows and behavioral rules.

---

## 🐛 Issues & Troubleshooting

Found a bug or have a feature request?

- Read the [Issue Reporting Guide](REPORTING.md) before submitting an issue.
- Please report bugs or suggest enhancements via the [GitHub Issue Tracker](https://github.com/made-on-weekends/snap-it/issues).
- For security-sensitive issues, please follow our responsible disclosure policy outlined in [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

Contributions are welcome! Read the [Contribution Guide](CONTRIBUTING.md) for development setup, contribution conventions, and the pull request process.

---

## ⭐ Support Us

If SnapIt is useful to you:
- ⭐ **Star this repository** to help others discover the project.
- 📣 **Spread the word** by sharing it with your network.
- ☕ **Support Our Work** — [Donate](https://asifiqbal.rocks/donation?utm_source=snap_it&utm_medium=github_readme&utm_campaign=readme&ref=snap-it-readme) to help us maintain and grow our open-source projects.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
