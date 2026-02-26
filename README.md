# supercharli

SuperCharli is a local-first intelligent companion project.

This repository separates two layers clearly:
- Product principles: personality, memory, evolution constraints.
- Engineering principles: availability, performance, maintainability, extensibility.

## Current Status
- Principles and constitutions are established.
- V1 planning templates are in place.
- V1 runtime core, local persistent memory, severity state machine, fallback chain, backup/restore baseline, and daemon CLI baseline are implemented under `src/`.

## Repo Structure
- `persona.toml`: machine-readable personality baseline.
- `docs/principles/`: product and engineering constitutions.
- `docs/plans/`: phased implementation planning artifacts.
- `docs/guide/`: workflow, collaboration, handoff, and publishing guides.
- `docs/index.zh-CN.md`: documentation entrypoint.

## Working Rules
- Keep product principles and engineering principles separate.
- Do not implement beyond V1 scope unless scope document is updated first.
- Preserve local memory sovereignty and stable identity across model switches.

## Start Here
1. Read `docs/index.zh-CN.md`.
2. Read `docs/guide/project-overview.zh-CN.md`.
3. Read `docs/guide/development-workflow.zh-CN.md`.
4. Follow `docs/guide/model-collaboration-contract.zh-CN.md` for model-driven implementation.

## Quick Start
- Run demo:
  - `npm run demo`
- Run tests:
  - `npm test`

By default, demo uses local SQLite memory at `data/supercharli.db`.
You can override with:
- `SUPERCHARLI_DB_PATH=/absolute/path/to/memory.db npm run demo`

## Runtime Highlights
- Route strategy: fast/deep route with explicit route reason.
- Fallback chain: retry primary once -> switch secondary -> minimal-safe response mode.
- Safety: persona guard with regeneration on certainty/risk violations.
- Memory: local L1/L2 with auto-promotion and restart persistence.
- Telemetry: per-turn stage events and counters for fallback/safety/latency tracking.
- Provider adapters: model-agnostic, configuration-driven `provider:model` routing.

## Daemon + CLI
- Start daemon:
  - `npm run daemon:start`
- Check status:
  - `npm run daemon:status`
- Interactive chat:
  - `npm run cli -- --session main`
- Guide:
  - `docs/guide/daemon-cli.zh-CN.md`

## Repo-Safe Runtime (No Repo Mutation)
- Use wrapper script:
  - `scripts/supercharli-runtime.sh start`
  - `scripts/supercharli-runtime.sh cli --session main`
- This keeps runtime data outside repo under `~/supercharli-runtime` by default.

## Portability
- Create snapshot:
  - `npm run backup`
- Restore snapshot:
  - `npm run restore -- backups/<snapshot-id>`
- Backup/restore guide:
  - `docs/guide/local-backup-restore.zh-CN.md`

## Model Provider Config
- Guide:
  - `docs/guide/model-provider-config.zh-CN.md`
- Env template:
  - `scripts/env/supercharli.env.example.sh`
- Provider config template:
  - `scripts/env/providers.config.example.json`
- macOS startup loader:
  - `scripts/env/install-launchagent.sh`

## Open Source Governance
- `CONTRIBUTING.md`: contribution workflow and quality gate.
- `CODE_OF_CONDUCT.md`: community behavior expectations.
- `SECURITY.md`: private vulnerability disclosure policy.
- `SUPPORT.md`: support and issue reporting guidance.
- `CHANGELOG.md`: notable changes and release-facing history.

## Continuity
- `docs/guide/continuity-playbook.zh-CN.md`: handoff and continuity baseline.
- `docs/guide/current-state.zh-CN.md`: current project status snapshot.
- `docs/guide/next-actions.zh-CN.md`: prioritized next steps.
- `docs/guide/decision-log.zh-CN.md`: durable decision record.
- `docs/guide/branching-policy.zh-CN.md`: branch and merge discipline.
