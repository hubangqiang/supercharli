# Implementation Roadmap (V1)

## Purpose
Provide a time-sequenced execution plan from planning docs to implementation start.

## Milestone M0: Spec Freeze
### Duration
- 2-3 days

### Deliverables
- Runtime component boundaries finalized.
- Acceptance targets frozen.
- Risk controls and observability baselines frozen.

### Exit Gate
- No unresolved scope ambiguity in core docs.
- No blocking conflict between principles and plans.

## Milestone M1: Kernel Skeleton
### Duration
- 4-6 days

### Deliverables
- Orchestrated request pipeline skeleton.
- Response normalization path.
- Basic telemetry hooks.

### Exit Gate
- Pipeline runs end-to-end with placeholder adapters.
- Stage failures degrade safely.

## Milestone M2: Persona + Severity Core
### Duration
- 4-6 days

### Deliverables
- Persona guard checks implemented.
- Severity state machine (Normal/S1/S2/S3) with TTL.

### Exit Gate
- Charter violations blocked.
- Severity transitions logged and deterministic.

## Milestone M3: Memory Engine V1
### Duration
- 5-7 days

### Deliverables
- L1 read/write loop.
- L1->L2 promotion pipeline.
- Conflict handling and pruning baseline.

### Exit Gate
- Repeated-pattern promotion works under policy constraints.
- Memory decisions are inspectable.

## Milestone M4: Model Routing + Fallback
### Duration
- 3-5 days

### Deliverables
- Fast/deep routing path.
- Retry -> secondary -> safe response fallback chain.

### Exit Gate
- Primary model failure does not break user-facing response.
- Route and fallback telemetry available.

## Milestone M5: Acceptance and Hardening
### Duration
- 4-6 days

### Deliverables
- Demo scenarios executable.
- Acceptance metrics measured across 2 rounds.
- Backup/restore and migration dry-run scripts validated.

### Exit Gate
- `docs/plans/acceptance.v1.md` targets satisfied.
- No unresolved high-impact risk in risk register.

## Merge Policy
- Development continues on `codex/*` branches.
- Merge to `main` only after milestone gate completion.
- Each milestone merge must include updated docs and verification evidence.
