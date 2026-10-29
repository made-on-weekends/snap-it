# SnapIt

High-speed website screenshot tool for single pages, full-page scrolling captures, and bulk URL queues. Includes an integrated canvas annotation studio.

## Features

- **Single Page & Viewport Capture**: Instant capture of the visible viewport or full scrollable document via Chrome DevTools Protocol (CDP).
- **Interactive Area Crop**: On-screen drag-to-select region capture.
- **Canvas Annotation Studio**: Markup screenshots with arrows, shapes, text callouts, steps, loupe zoom, spotlights, and privacy redaction (blur, pixelate, blackout).
- **Batch Processing**: Queue multiple URLs for automated sequential captures.
- **Cross-Browser Support**: Zero-build architecture supporting both Chromium-based browsers (Chrome, Edge, Brave) and Mozilla Firefox.

## Quick Start

### Chrome / Chromium

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select this directory (or run `npm run build:chrome` and select `dist/chrome`).

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.firefox.json` (or run `npm run build:firefox` and select `dist/firefox/manifest.json`).

## Scripts

- `npm run build`: Assembles Chrome and Firefox packages into `dist/`.
- `npm run build:chrome`: Assembles Chromium package into `dist/chrome`.
- `npm run build:firefox`: Assembles Firefox package into `dist/firefox`.
- `npm run manifests`: Re-generates `manifest.chrome.json` and `manifest.firefox.json` from `manifest.json`.
- `npm run lint:firefox`: Lints Firefox distribution with `web-ext`.

## 📚 Documentation

For technical details, project guidelines, and development context:

- 🤖 **For AI Coding Agents:** Refer to [AGENTS.md](AGENTS.md) for development commands, project conventions, and agent instructions.
- 🏗️ **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for extension layers, CDP pipelines, and storage engines.
- ⚖️ **Decision Log:** See [docs/DECISIONS.md](docs/DECISIONS.md) for architectural decisions, rationale, and established conventions.
- 🎯 **Product Scope:** See [docs/PRODUCT.md](docs/PRODUCT.md) for product goals, supported features, and boundaries.
- 🎨 **Design System:** See [docs/DESIGN.md](docs/DESIGN.md) for design tokens, typography, colors, and UI foundations.
- 🏷️ **Brand Identity:** See [docs/BRAND.md](docs/BRAND.md) for brand positioning, voice, and visual rules.
- 🛡️ **Security Guidelines:** See [SECURITY.md](SECURITY.md) for security policy and [docs/SECURITY.md](docs/SECURITY.md) for threat modeling.

## 🐛 Issues & Troubleshooting

Found a bug or have a feature request? Read the [Issue Reporting Guide](REPORTING.md) before submitting an issue to our [issue tracker](https://github.com/made-on-weekends/snap-it/issues).

## 🤝 Contributing

Contributions are welcome! Read the [Contribution Guide](CONTRIBUTING.md) for development setup, contribution conventions, and the pull request process.

## ⭐ Support Us

If SnapIt is useful to you:
- ⭐ **Star this repository** to help others discover the project.
- 📣 **Spread the word** by sharing it with your network.
- ☕ **Support Our Work** — [Donate](https://asifiqbal.rocks/donation?utm_source=snap_it&utm_medium=github_readme&utm_campaign=readme&ref=snap-it-readme) to help us maintain and grow our open-source projects.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
