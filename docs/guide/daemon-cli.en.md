# Daemon + CLI Guide

## Goal
Provide local persistent interactive experience with a background daemon.

## Commands
- Start: `npm run daemon:start`
- Status: `npm run daemon:status`
- Stop: `npm run daemon:stop`
- Interactive chat: `npm run cli -- --session main`

## Repo-Safe Wrapper
- `scripts/supercharli-runtime.sh start`
- `scripts/supercharli-runtime.sh cli`
- `scripts/supercharli-runtime.sh export`
- `scripts/supercharli-runtime.sh import <bundle-dir>`

Default runtime paths are outside repository under `~/supercharli-runtime`.
