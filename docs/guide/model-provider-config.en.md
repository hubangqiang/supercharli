# Model Provider Configuration

## Goal
- Integrate multiple model providers via external config.
- Keep repository free of hardcoded concrete model settings.

## Recommended Entry
```bash
npm run init:user
```
It generates:
- `~/.config/supercharli/charli.profile.json`
- `~/.config/supercharli/providers.config.json`
- `~/.config/supercharli/supercharli.env.sh`

## Config Structure
- `providers`: list of provider definitions
- `routes`: `fast/deep/secondary` mapped to `provider:model`

## Key Environment Variables
- `SUPERCHARLI_PROVIDER_CONFIG_FILE`
- `SUPERCHARLI_PROFILE_FILE`
- provider key env vars referenced by `apiKeyEnv`

## macOS Startup
- Install: `scripts/env/install-launchagent.sh ~/.config/supercharli/supercharli.env.sh`
- Uninstall: `scripts/env/uninstall-launchagent.sh ~/.config/supercharli/supercharli.env.sh`
