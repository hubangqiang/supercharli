#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-$HOME/.config/supercharli/supercharli.env.sh}"
LABEL="com.supercharli.env"
PLIST_TARGET="$HOME/Library/LaunchAgents/${LABEL}.plist"
TEMPLATE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.launchagents/${LABEL}.plist.template"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE"
  echo "create it from scripts/env/supercharli.env.example.sh first"
  exit 1
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "template not found: $TEMPLATE"
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"
ESCAPED_ENV_FILE=$(printf '%s\n' "$ENV_FILE" | sed 's/[\\&]/\\&/g')
sed "s#__ENV_FILE__#${ESCAPED_ENV_FILE}#g" "$TEMPLATE" > "$PLIST_TARGET"

if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
  launchctl bootout "gui/$(id -u)" "$PLIST_TARGET" || true
fi

launchctl bootstrap "gui/$(id -u)" "$PLIST_TARGET"
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

echo "installed: $PLIST_TARGET"
echo "env file: $ENV_FILE"
echo "verify with: launchctl getenv SUPERCHARLI_MODEL_FAST"
