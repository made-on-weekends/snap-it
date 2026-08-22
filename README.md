# SnapIt

SnapIt is a browser extension that lets you bulk-capture screenshots from a list of URLs. It can run in the background, sequentialize capture jobs, wait between captures, and save files either to your default Downloads folder or to any directory on your computer using the HTML5 File System Access API.

## 🚀 Quickstart

### Installation in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the root folder of this project (`screens`).

### Configuration
- Click the extension icon in your toolbar to open the SnapIt controller page.
- Click the gear/settings icon to configure wait delay, format, capture mode (Full Page vs Viewport), and choose your save destination directory.

## 📖 Technical Documentation
- For AI coding agents: see [AGENTS.md](./AGENTS.md)
- Product Scope & Goals: see [docs/PRODUCT.md](./docs/PRODUCT.md)
- Architecture Overview: see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Decisions Log: see [docs/DECISIONS.md](./docs/DECISIONS.md)

## 🎨 Design & Aesthetics
SnapIt strictly adheres to the official SnapIt Capture Frame design system — a dual-mode interface featuring cool graphite neutrals, cobalt accents, zero distracting gradients or glassmorphism washes over captured content, and precise typography (**Geist**, **Inter**, and **Geist Mono**). See [docs/DESIGN.md](./docs/DESIGN.md) for full visual tokens.

## 🛠️ Development
To verify JavaScript syntax before committing changes:
```bash
node -c storage-helper.js service-worker.js popup/popup.js settings/settings.js
```

## 🐛 Issues & Troubleshooting

Encountered an issue or have a feature suggestion?
- View our [Quick Guide to Reporting Issues](REPORTING.md) before submitting an issue.
- Read [AGENTS.md](AGENTS.md) for quick command reminders and agent coding guidelines.

## 🤝 Contributing

We are always looking for improvements and additions! Please read the [Contribution Guide](CONTRIBUTING.md) to understand our branching strategy, conventions, and pull request checklist.

## ⭐ Support Us

If **SnapIt** makes bulk-capturing screenshots seamless and saves you time:
- ⭐ **Star this repository** to help others discover the project.
- 📣 **Spread the word** on X/Twitter or your blog.
- ☕ **Support the maintainer** via [donation](https://asifiqbal.rocks/donation?utm_source=snap_it&utm_medium=github_readme&utm_campaign=readme&ref=snap-it-readme) to fund further open-source initiatives.

---

## 👤 Author
Developed and maintained by [Adommo LLC](https://adommo.com).

## 📄 License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit).
