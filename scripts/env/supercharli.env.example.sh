#!/usr/bin/env bash
# SuperCharli provider config template (model-agnostic).
# Recommended first step: run `npm run init:user`.

# External provider config (OpenClaw-style: file-driven)
export SUPERCHARLI_PROVIDER_CONFIG_FILE="$HOME/.config/supercharli/providers.config.json"

# User profile (role/background/personality)
export SUPERCHARLI_PROFILE_FILE="$HOME/.config/supercharli/charli.profile.json"

# Provider keys referenced by providers.config.json(apiKeyEnv)
export PRIMARY_PROVIDER_API_KEY=""
export REASONING_PROVIDER_API_KEY=""
export BACKUP_PROVIDER_API_KEY=""

# Optional route overrides (if set, override config.routes)
# export SUPERCHARLI_MODEL_FAST="primary:MODEL_FAST"
# export SUPERCHARLI_MODEL_DEEP="reasoning:MODEL_DEEP"
# export SUPERCHARLI_MODEL_SECONDARY="backup:MODEL_FALLBACK"

# Optional runtime paths
# export SUPERCHARLI_DB_PATH="$HOME/supercharli-runtime/data/supercharli.db"
# export SUPERCHARLI_BACKUP_DIR="$HOME/supercharli-runtime/backups"
# export SUPERCHARLI_RUNTIME_DIR="$HOME/supercharli-runtime/run"
