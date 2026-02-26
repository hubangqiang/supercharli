# Engineering Constitution 1.0

This document defines engineering governance for the SuperCharli project.
It does not define product personality, memory philosophy, or interaction style.

## 1. Availability First
- Critical paths must be simple, stable, and degradable.
- A single failure point must not take down the whole system.
- Core capability must still return a minimal service under faults.

## 2. Performance Budget First
- Define explicit latency/resource budgets for critical chains.
- Keep synchronous path minimal, move heavy work async.
- Any new capability must include performance cost evaluation.

## 3. Maintainability Over Short-Term Speed
- Clear module boundaries, single responsibility, stable dependency direction.
- Reject implicit coupling and magic behavior.
- Optimize for readability, testability, replaceability.

## 4. Extensible Architecture
- Stable core abstractions, pluggable peripheral implementations.
- Adding models/policies/storage should not break the main flow.
- Integrate via contracts, not implementation details.

## 5. Observability and Auditability
- Key behaviors must have logs, metrics, and traces.
- Key decisions must be replayable and explainable.
- Incidents must be diagnosable, reproducible, and verifiably fixed.

## 6. Data and State Governance
- State storage must support versioning, migration, and rollback.
- Consistency requirements and compensation paths must be explicit.
- Historical state must be exportable, importable, recoverable.

## 7. Reliable Delivery
- Use progressive rollout and rollback mechanisms.
- Critical changes require automated validation.
- Fix priorities: availability > correctness > performance > experience.

## 8. Security and Boundary
- Least privilege, default deny, explicit authorization.
- Sensitive information controlled in transfer/storage/logs.
- Risky capabilities require dedicated switches and audit trails.

## 9. Compatibility and Migration
- Upgrade paths must be predictable and explainable.
- External contract changes follow compatibility strategy and transition period.
- Prefer migration tooling over manual migration.

## 10. Engineering Culture
- Define goals/boundaries before implementation.
- Validate assumptions before scaling complexity.
- Use facts/metrics to drive decisions over preferences.
