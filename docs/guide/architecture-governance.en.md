# Architecture Governance (Stable Core, Flexible Extensions)

## Goal
- Keep core layers stable, testable, and portable.
- Keep extension layers fast-iterating, pluggable, and reversible.

## Layer Model
- Stable core: `src/core`, `src/memory`, `src/daemon`
- Strategy extensions: `src/learning`, `src/router`, `src/providers`
- Runtime/ops layer: `src/runtime`, `src/ops`, `src/observability`

## Dependency Direction (Hard Rules)
- `core` may depend only on `core/observability`
- `memory` may depend only on `memory/runtime`
- `learning` may depend only on `learning/memory`
- `providers` may depend only on `providers`
- `router` may depend only on `router/providers`
- `daemon` can compose core + extension layers
- `runtime` can compose `core/memory/router` for run/demo wiring

## Merge Gate
- Every `npm test` run must pass architecture boundary checks first:
  - `scripts/check-architecture-boundaries.js`
- Any boundary violation fails the build.

## Engineering Value Requirements
- Core interfaces must remain backward-compatible by default.
- Any schema upgrade requires migration + regression tests.
- Extension logic must plug in through module contracts, not core intrusion.
- Critical decisions must remain observable (logs/metrics/traces).
