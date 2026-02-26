#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-}"
if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

vars=$(grep -E '^export [A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" | sed -E 's/^export ([A-Za-z_][A-Za-z0-9_]*)=.*/\1/' | sort -u)
for var in $vars; do
  value="${!var-}"
  launchctl setenv "$var" "$value"
done

echo "launchctl environment applied from: $ENV_FILE"
