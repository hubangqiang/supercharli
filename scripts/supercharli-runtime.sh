#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_HOME="${SUPERCHARLI_RUNTIME_HOME:-$HOME/supercharli-runtime}"
USER_ENV_FILE="${SUPERCHARLI_ENV_FILE:-$HOME/.config/supercharli/supercharli.env.sh}"

if [[ "${SUPERCHARLI_NO_AUTO_SOURCE:-0}" != "1" && -f "$USER_ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$USER_ENV_FILE"
fi

export SUPERCHARLI_DB_PATH="${SUPERCHARLI_DB_PATH:-$RUNTIME_HOME/data/supercharli.db}"
export SUPERCHARLI_BACKUP_DIR="${SUPERCHARLI_BACKUP_DIR:-$RUNTIME_HOME/backups}"
export SUPERCHARLI_RUNTIME_DIR="${SUPERCHARLI_RUNTIME_DIR:-$RUNTIME_HOME/run}"

mkdir -p "$(dirname "$SUPERCHARLI_DB_PATH")" "$SUPERCHARLI_BACKUP_DIR" "$SUPERCHARLI_RUNTIME_DIR"

cmd="${1:-}"
shift || true

if [[ -z "$cmd" ]]; then
  echo "Usage: scripts/supercharli-runtime.sh <start|stop|status|cli|chat|metrics|demo|test|backup|restore|export|import> [args...]"
  exit 1
fi

cd "$ROOT_DIR"

case "$cmd" in
  start)
    npm run daemon:start
    ;;
  stop)
    npm run daemon:stop
    ;;
  status)
    npm run daemon:status
    ;;
  cli)
    npm run cli -- "$@"
    ;;
  chat)
    text="${1:-}"
    session="${2:-main}"
    if [[ -z "$text" ]]; then
      echo "Usage: scripts/supercharli-runtime.sh chat \"text\" [session]"
      exit 1
    fi
    npm run cli -- --session "$session" --text "$text"
    ;;
  metrics)
    npm run cli -- --metrics
    ;;
  demo)
    npm run demo
    ;;
  test)
    npm test
    ;;
  backup)
    npm run backup
    ;;
  restore)
    npm run restore -- "$@"
    ;;
  export)
    npm run export:bundle -- "$@"
    ;;
  import)
    npm run import:bundle -- "$@"
    ;;
  *)
    echo "Unsupported command: $cmd"
    exit 1
    ;;
esac
