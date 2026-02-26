#!/usr/bin/env bash
set -euo pipefail

LABEL="com.supercharli.env"
PLIST_TARGET="$HOME/Library/LaunchAgents/${LABEL}.plist"
ENV_FILE="${1:-$HOME/.config/supercharli/supercharli.env.sh}"

launchctl bootout "gui/$(id -u)" "$PLIST_TARGET" 2>/dev/null || true
rm -f "$PLIST_TARGET"

if [[ -f "$ENV_FILE" ]]; then
  vars=$(grep -E '^export [A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" | sed -E 's/^export ([A-Za-z_][A-Za-z0-9_]*)=.*/\1/' | sort -u)
  for var in $vars; do
    launchctl unsetenv "$var" || true
  done
fi

echo "removed: $PLIST_TARGET"
echo "launchctl env cleared using: $ENV_FILE"
