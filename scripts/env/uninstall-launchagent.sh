#!/usr/bin/env bash
set -euo pipefail

LABEL="com.supercharli.env"
PLIST_TARGET="$HOME/Library/LaunchAgents/${LABEL}.plist"

launchctl bootout "gui/$(id -u)" "$PLIST_TARGET" 2>/dev/null || true
rm -f "$PLIST_TARGET"

echo "removed: $PLIST_TARGET"
echo "optional cleanup: launchctl unsetenv SUPERCHARLI_MODEL_FAST"
