# SnapIt

High-speed website screenshot tool for Google Chrome and Mozilla Firefox. SnapIt supports single-page visible captures, full-page scrolling captures, interactive area selection, and bulk URL queues — with a built-in canvas annotation studio.

---

## Features

- **Visible Area Capture**: Instant screenshot of the current viewport.
- **Full Page Capture**: Automated scrolling capture assembling full-height page renders.
- **Selected Area Capture**: Interactive rectangle overlay to capture specific page elements.
- **Bulk Capture Queue**: Sequential capture of multiple URLs with customizable delay.
- **Annotation Studio**:
  - Shapes & Drawing: Arrows, rectangles, circles, freehand pen, and lines.
  - Text & Markers: Numbered badge steps and custom typography.
  - Privacy & Focus: Solid ink redaction and spotlight focus highlighting.
  - Crop & Resize: Canvas framing and aspect ratio cropping.
- **Export Formats**: PNG, JPEG, and WebP with configurable compression quality.
- **Keyboard Shortcuts**: Configurable hotkeys for common capture actions.
- **Native Design System**: Dark and light theme modes powered by modern design tokens.

---

## Installation & Getting Started

SnapIt is a Manifest V3 browser extension with no external build step or runtime dependencies.

### Google Chrome / Chromium

1. Clone or download this repository:
   ```bash
   git clone https://github.com/made-on-weekends/snap-it.git
   ```
2. Build the Chrome extension package:
   ```bash
   ./scripts/build-chrome.sh
   ```
3. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
4. Enable **Developer mode** via the toggle switch in the top-right corner.
5. Click **Load unpacked** and select the `dist/chrome` directory.
6. SnapIt is now installed and accessible from your browser extensions toolbar.

### Mozilla Firefox

1. Clone this repository and run the packaging script:
   ```bash
   ./scripts/build-firefox.sh
   ```
2. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Click **Load Temporary Add-on...**
4. Select `dist/firefox/manifest.json` (or `dist/snap-it-firefox.zip`).
5. SnapIt is now active in Firefox!

---

## Project Structure

```text
snap-it/
├── assets/                 # Fonts, design tokens, extension icons, and graphics
├── content/                # Injected content scripts (interactive area selection)
├── popup/                  # Extension popup menus and canvas annotation studio
├── settings/               # Extension options and preference management
├── docs/                   # System documentation (architecture, product, security, design)
├── scripts/                # Packaging utilities (build.sh, build-chrome.sh, build-firefox.sh, generate-manifests.js)
├── manifest.json           # Single source of truth for shared extension metadata
├── manifest.chrome.json    # Chrome Manifest V3 configuration (generated)
├── manifest.firefox.json   # Firefox Manifest V3 configuration (generated)
├── service-worker.js       # Background service worker handling capture pipelines
└── storage-helper.js       # Wrapper for browser storage management
```

---

## 📚 Documentation

For technical details, project guidelines, and development context:

- 🤖 **For AI Coding Agents:** Refer to [AGENTS.md](AGENTS.md) for development commands, project conventions, and agent instructions.
- 🏗️ **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system structure, background service worker orchestration, and capture lifecycles.
- ⚖️ **Decision Log:** See [docs/DECISIONS.md](docs/DECISIONS.md) for settled architectural decisions and rationale.
- 🎯 **Product Scope:** See [docs/PRODUCT.md](docs/PRODUCT.md) for product goals, supported features, and non-goals.
- 🎨 **Design System:** See [docs/DESIGN.md](docs/DESIGN.md) for design tokens, typography, and color ramps.
- 🏷️ **Brand Identity:** See [docs/BRAND.md](docs/BRAND.md) for brand positioning, voice, and logo guidelines.
- 🔄 **User Flows & UX:** See [docs/UX.md](docs/UX.md) for user interactions, notification copy, and state behaviors.
- 🧩 **Components:** See [docs/COMPONENTS.md](docs/COMPONENTS.md) for UI controls, keycaps, and annotation tools.
- 🛡️ **Security Guidelines:** See [docs/SECURITY.md](docs/SECURITY.md) and root [SECURITY.md](SECURITY.md) for security policy, permissions, and threat modeling.
- 🧪 **Testing Strategy:** See [docs/TESTING.md](docs/TESTING.md) for test procedures and manual extension verification.

---

## 🐛 Issues & Troubleshooting

Found a bug or have a feature request?

- Read the [Issue Reporting Guide](REPORTING.md) before submitting an issue.
- Please report bugs or feature requests via GitHub Issues: [made-on-weekends/snap-it Issues](https://github.com/made-on-weekends/snap-it/issues).
- For security vulnerabilities, do not open a public issue — refer to the responsible disclosure process in [SECURITY.md](SECURITY.md).

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
Bundled fonts are licensed under the SIL Open Font License — see [assets/fonts/OFL.txt](assets/fonts/OFL.txt).
