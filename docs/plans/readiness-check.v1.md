# Readiness Check (V1)

## Purpose
Decide whether the project is ready to move from planning to implementation.

## A. Principle Alignment
- [ ] Product principles are frozen for current milestone.
- [ ] Engineering principles are frozen for current milestone.
- [ ] No conflict exists between product and engineering constraints.

## B. Scope and Acceptance
- [ ] `docs/plans/scope.md` is up to date.
- [ ] `docs/plans/acceptance.v1.md` includes measurable targets.
- [ ] V1 out-of-scope items are explicitly protected from accidental inclusion.

## C. Runtime Design Completeness
- [ ] Conversation flow defines stage contracts and failure handling.
- [ ] Persona runtime defines priority and rejection rules.
- [ ] Memory policy defines promotion/conflict/pruning behavior.
- [ ] Routing and fallback policies are complete and testable.
- [ ] Severity state behavior is deterministic and TTL-bounded.

## D. Operability Baseline
- [ ] Observability spec defines logs/metrics/traces and alerts.
- [ ] Backup/restore playbook is actionable.
- [ ] Migration playbook includes compatibility gates and rollback policy.
- [ ] Risk register includes trigger signals and contingencies.

## E. Execution Readiness
- [ ] Implementation backlog is actionable.
- [ ] Runtime component boundaries are explicit.
- [ ] Bootstrap tasklist is ready for sprint kickoff.
- [ ] Branching policy and handoff docs are in effect.

## F. Go / No-Go Rule
- Go: all A-E sections checked.
- Conditional Go: max 2 unchecked items, none from sections A/B.
- No-Go: unresolved blocker in principles, scope, or acceptance.

## Sign-off
- Date:
- Reviewer:
- Decision: Go / Conditional Go / No-Go
- Notes:
