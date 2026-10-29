#!/usr/bin/env bash
# ==============================================================================
# SnapIt — Chrome Package Builder (Zero-Build / Dependency-Free)
# ==============================================================================
# Convenience wrapper delegating to scripts/build.sh chrome.
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "${ROOT_DIR}/scripts/build.sh" chrome
