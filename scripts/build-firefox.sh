#!/usr/bin/env bash
# ==============================================================================
# SnapIt — Firefox Package Builder (Zero-Build / Dependency-Free)
# ==============================================================================
# Convenience wrapper delegating to scripts/build.sh firefox.
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "${ROOT_DIR}/scripts/build.sh" firefox

