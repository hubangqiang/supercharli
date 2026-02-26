# supercharli

SuperCharli is a local-first intelligent companion project.

This repository separates two layers clearly:
- Product principles: personality, memory, evolution constraints.
- Engineering principles: availability, performance, maintainability, extensibility.

## Current Status
- Principles and constitutions are established.
- V1 planning templates are in place.
- Implementation is intentionally not started yet.

## Repo Structure
- `persona.toml`: machine-readable personality baseline.
- `charter*.md`: non-negotiable constraints.
- `constitution*.md`: full product governance principles.
- `engineering.constitution.zh-CN.md`: engineering governance principles.
- `plans/`: phased implementation planning artifacts.
- `docs/`: model-agnostic development and handoff documentation.

## Working Rules
- Keep product principles and engineering principles separate.
- Do not implement beyond V1 scope unless scope document is updated first.
- Preserve local memory sovereignty and stable identity across model switches.

## Start Here
1. Read `docs/01-project-overview.zh-CN.md`.
2. Read `docs/02-development-workflow.zh-CN.md`.
3. Follow `docs/03-model-collaboration-contract.zh-CN.md` for any model-driven implementation.
4. Use `docs/04-handoff-checklist.zh-CN.md` before handing work to another model.

## Open Source Governance
- `CONTRIBUTING.md`: contribution workflow and quality gate.
- `CODE_OF_CONDUCT.md`: community behavior expectations.
- `SECURITY.md`: private vulnerability disclosure policy.
- `SUPPORT.md`: support and issue reporting guidance.
- `CHANGELOG.md`: notable changes and release-facing history.
