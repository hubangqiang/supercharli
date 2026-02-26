# Bootstrap Tasklist (V1)

## Objective
Provide a day-1 to day-N executable tasklist to start implementation without ambiguity.

## Sprint 0 (Setup)
### Task B0-01: Project Skeleton
- Create runtime package skeleton for kernel, guard, memory, router, fallback, observability.
- Output: module directories and entrypoints.

### Task B0-02: Contract Definitions
- Define internal contracts for stage I/O and response normalization.
- Output: shared contract docs/code stubs.

### Task B0-03: Dev Tooling Baseline
- Add lint/format/test script placeholders and CI stub.
- Output: local and CI validation entrypoints.

## Sprint 1 (Kernel Path)
### Task B1-01: Ingest Stage
- Implement request normalization and validation.
- DoD: malformed input fails safely.

### Task B1-02: Guard Stage
- Implement persona gate + severity mode evaluation call path.
- DoD: blocked outputs are rejected and regenerate flow is triggered.

### Task B1-03: Normalize Stage
- Implement response contract normalizer.
- DoD: all action responses include next step and completion signal.

## Sprint 2 (Memory Path)
### Task B2-01: L1 Engine
- Implement session memory write/read with bounded recall budget.
- DoD: 10-turn continuity scenario passes.

### Task B2-02: L2 Promotion Pipeline
- Implement candidate detection and promotion rules.
- DoD: repeated-pattern auto-promotion works under threshold policy.

### Task B2-03: Conflict & Prune
- Implement conflict handling and stale down-ranking logic.
- DoD: contradiction scenario resolves safely and is logged.

## Sprint 3 (Model Path)
### Task B3-01: Fast/Deep Routing
- Implement route selection based on policy.
- DoD: route decisions are deterministic and logged.

### Task B3-02: Fallback Chain
- Implement retry -> secondary -> safe minimal response.
- DoD: primary failure still yields usable response.

## Sprint 4 (Ops Path)
### Task B4-01: Trace/Log/Metrics Hooks
- Implement minimum observability hooks.
- DoD: each turn is trace-linked across stages.

### Task B4-02: Acceptance Harness
- Convert demo scenarios to runnable acceptance checks.
- DoD: all mandatory scenarios produce pass/fail outputs.

### Task B4-03: Backup/Migration Dry-run
- Execute backup/restore and migration dry-run.
- DoD: restore and migration checks pass in staging.

## Branching Rule
- One logical task cluster per `codex/*` branch.
- Merge only after milestone gate and acceptance evidence.

## Definition of Ready (DoR)
A task is ready when:
- scope is clear,
- dependencies are identified,
- acceptance condition is explicit.

## Definition of Done (DoD)
A task is done when:
- behavior works as specified,
- docs are updated,
- validation evidence is recorded,
- no hidden scope expansion occurred.
