# supercharli

SuperCharli is a local-first intelligent companion project.

This repository separates two layers clearly:
- Product principles: personality, memory, evolution constraints.
- Engineering principles: availability, performance, maintainability, extensibility.

## Current Status
- Principles and constitutions are established.
- V1 planning templates are in place.
- V1 runtime core skeleton is started under `src/` with local demo path.

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
