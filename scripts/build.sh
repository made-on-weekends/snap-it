#!/usr/bin/env bash
# ==============================================================================
# SnapIt — Unified Cross-Browser Package Builder (Zero-Build / Dependency-Free)
# ==============================================================================
# Usage:
#   ./scripts/build.sh          # Build both Chrome and Firefox packages
#   ./scripts/build.sh chrome   # Build only Chrome package (or ./scripts/build-chrome.sh)
#   ./scripts/build.sh firefox  # Build only Firefox package (or ./scripts/build-firefox.sh)
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
TARGET="${1:-all}"

# Ensure fresh manifests are generated from canonical manifest.json
node "${ROOT_DIR}/scripts/generate-manifests.js"

build_chrome() {
  local CHROME_DIR="${DIST_DIR}/chrome"
  local ZIP_FILE="${DIST_DIR}/snap-it-chrome.zip"

  echo "🌐 Packaging SnapIt for Google Chrome / Chromium..."
  rm -rf "${CHROME_DIR}" "${ZIP_FILE}"
  mkdir -p "${CHROME_DIR}"

  cp "${ROOT_DIR}/manifest.chrome.json" "${CHROME_DIR}/manifest.json"
  cp "${ROOT_DIR}/service-worker.js" "${CHROME_DIR}/"
  cp "${ROOT_DIR}/storage-helper.js" "${CHROME_DIR}/"
  cp -R "${ROOT_DIR}/assets" "${CHROME_DIR}/"
  cp -R "${ROOT_DIR}/content" "${CHROME_DIR}/"
  cp -R "${ROOT_DIR}/popup" "${CHROME_DIR}/"
  cp -R "${ROOT_DIR}/settings" "${CHROME_DIR}/"

  echo "✅ Chrome package assembled at: dist/chrome"

  if command -v zip >/dev/null 2>&1; then
    (cd "${CHROME_DIR}" && zip -qr "${ZIP_FILE}" .)
    echo "📦 Chrome zip created at: dist/snap-it-chrome.zip"
  fi
}

build_firefox() {
  local FIREFOX_DIR="${DIST_DIR}/firefox"
  local ZIP_FILE="${DIST_DIR}/snap-it-firefox.zip"

  echo "🦊 Packaging SnapIt for Mozilla Firefox..."
  rm -rf "${FIREFOX_DIR}" "${ZIP_FILE}"
  mkdir -p "${FIREFOX_DIR}"

  cp "${ROOT_DIR}/manifest.firefox.json" "${FIREFOX_DIR}/manifest.json"
  cp "${ROOT_DIR}/service-worker.js" "${FIREFOX_DIR}/"
  cp "${ROOT_DIR}/storage-helper.js" "${FIREFOX_DIR}/"
  cp -R "${ROOT_DIR}/assets" "${FIREFOX_DIR}/"
  cp -R "${ROOT_DIR}/content" "${FIREFOX_DIR}/"
  cp -R "${ROOT_DIR}/popup" "${FIREFOX_DIR}/"
  cp -R "${ROOT_DIR}/settings" "${FIREFOX_DIR}/"

  echo "✅ Firefox package assembled at: dist/firefox"

  if command -v zip >/dev/null 2>&1; then
    (cd "${FIREFOX_DIR}" && zip -qr "${ZIP_FILE}" .)
    echo "📦 Firefox zip created at: dist/snap-it-firefox.zip"
  fi
}

case "${TARGET}" in
  chrome)
    build_chrome
    ;;
  firefox)
    build_firefox
    ;;
  all)
    build_chrome
    echo ""
    build_firefox
    ;;
  *)
    echo "Unknown target '${TARGET}'. Use 'all', 'chrome', or 'firefox'."
    exit 1
    ;;
esac

echo ""
echo "🚀 Loading Instructions:"
echo "• Chrome:  chrome://extensions → Developer mode → 'Load unpacked' → Select dist/chrome"
echo "• Firefox: about:debugging#/runtime/this-firefox → 'Load Temporary Add-on...' → Select dist/firefox/manifest.json"
