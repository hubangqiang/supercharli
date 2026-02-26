# Implementation Backlog (V1)

## Scope Guard
- V1 only includes conversation, memory, model routing, and governance-compliant runtime behavior.
- No external action execution in V1.

## Phase P1: Runtime Core
### Task P1-01: Request Pipeline Skeleton
- Goal: implement ingest -> guard -> recall -> route -> generate -> normalize -> persist.
- Done when:
  - all stages are callable in sequence,
  - stage I/O contracts are enforced,
  - stage failures are handled gracefully.

### Task P1-02: Persona Runtime Enforcement
- Goal: enforce persona priority order and rejection checks.
- Done when:
  - charter constraints cannot be bypassed by model output,
  - output regeneration occurs on persona violation,
  - severity mode changes tone/structure as specified.

### Task P1-03: Response Contract Normalizer
- Goal: normalize outputs into stable SuperCharli structure.
- Done when:
  - action-type responses include conclusion + next step + completion signal,
  - uncertainty is explicit when needed,
  - fallback responses keep identity consistency.

## Phase P2: Memory Engine
### Task P2-01: L1 Session Memory Loop
- Goal: write/read session memory with bounded relevance recall.
- Done when:
  - multi-turn continuity is stable,
  - retrieval budget is bounded,
  - non-relevant noise is excluded.

### Task P2-02: L1->L2 Auto-Promotion
- Goal: auto-promote repeated qualified patterns to L2.
- Done when:
  - repeat threshold and policy checks are applied,
  - candidate conflicts are resolved safely,
  - promotion decisions are logged.

### Task P2-03: Severity State Machine
- Goal: implement Normal/S1/S2/S3 with TTL de-escalation.
- Done when:
  - escalation/de-escalation path is deterministic,
  - TTL expiry causes expected transition,
  - S3 protection behavior is enforced.

## Phase P3: Model Routing & Reliability
### Task P3-01: Fast/Deep Routing
- Goal: choose model route by complexity and policy.
- Done when:
  - default fast route works,
  - deep route activates on upgrade conditions,
  - route decisions are logged.

### Task P3-02: Fallback Chain
- Goal: retry -> secondary -> safe minimal mode chain.
- Done when:
  - primary failures do not hard-stop responses,
  - user receives usable degraded response,
  - fallback telemetry is complete.

## Phase P4: Operations Readiness
### Task P4-01: Observability Baseline
- Goal: implement required logs/metrics/traces.
- Done when:
  - trace id links request, route, memory, response,
  - SLO metrics are queryable,
  - alerts fire on defined thresholds.

### Task P4-02: Backup/Restore and Migration
- Goal: deliver portable, recoverable local state lifecycle.
- Done when:
  - snapshot backup and restore runbook is executable,
  - migration checks prevent unsafe promotion,
  - rollback path is validated.

## Cross-Cutting Quality Tasks
### Task Q-01: Acceptance Harness
- Goal: codify scenario-driven validation from demo script.
- Done when:
  - all V1 acceptance scenarios are runnable,
  - pass/fail outputs are deterministic.

### Task Q-02: Risk Control Loop
- Goal: enforce weekly risk review and incident-triggered review.
- Done when:
  - risk triggers map to concrete mitigations,
  - unresolved blockers are visible before merge.

## Merge Gate for V1 to main
- All P1/P2/P3 tasks complete.
- Acceptance targets in `docs/plans/acceptance.v1.md` pass in 2 consecutive runs.
- No unresolved high-impact risk in `docs/plans/risk-register.md`.
- Documentation and implementation remain aligned.
