#!/usr/bin/env bash
# SuperCharli provider and routing config template.
# Usage:
#   cp scripts/env/supercharli.env.example.sh ~/.config/supercharli/supercharli.env.sh
#   vim ~/.config/supercharli/supercharli.env.sh
#   source ~/.config/supercharli/supercharli.env.sh

# DeepSeek
export DEEPSEEK_API_KEY=""
export DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

# Gemini
export GEMINI_API_KEY=""
# Optional (usually leave empty)
# export GEMINI_BASE_URL="https://generativelanguage.googleapis.com"

# Anthropic / Claude (official or relay)
export ANTHROPIC_BASE_URL=""
export ANTHROPIC_AUTH_TOKEN=""

# Routing model refs: provider:model
# Fast route: low-latency default
export SUPERCHARLI_MODEL_FAST="deepseek:deepseek-chat"
# Deep route: complex reasoning
export SUPERCHARLI_MODEL_DEEP="anthropic:claude-sonnet-4-20250514"
# Secondary route: fallback target
export SUPERCHARLI_MODEL_SECONDARY="gemini:gemini-2.0-flash"

# Optional runtime paths
# export SUPERCHARLI_DB_PATH="$HOME/Documents/code/supercharli/data/supercharli.db"
# export SUPERCHARLI_BACKUP_DIR="$HOME/Documents/code/supercharli/backups"
