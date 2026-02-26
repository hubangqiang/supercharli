# Memory Policy

## Purpose
Define implementation-ready memory behavior for L1/L2 in V1.

## L1 (Session Memory)
- Scope: current session continuity.
- Content: objective, next action, completion criteria, critical context.
- Retention: short-lived, session-scoped.
- Rule: keep only decision-relevant items.

## L2 (Long-term Memory)
- Scope: reusable behavior-result patterns across sessions.
- Content: stable patterns, constraints, lessons.
- Rule: local sovereignty; model-independent.
- Prohibited: secrets, transient emotion, unverified personal accusations.

## Promotion Logic (L1 -> L2)
- Trigger baseline:
  - repeated pattern >= 3,
  - useful for future decisions,
  - compatible with charter constraints.
- Promotion steps:
  1. detect candidate,
  2. summarize pattern,
  3. run conflict check,
  4. write L2 entry.

## Conflict Handling
- If new pattern conflicts with existing L2:
  - keep safer interpretation as default,
  - attach condition scope,
  - mark for review in evaluation cycle.

## Pruning / Down-ranking
- Down-rank stale low-impact entries.
- Prefer reversible archival over hard delete.
- Re-promote only if recurrence returns.

## Performance Rules
- Memory recall must be bounded by budget.
- Promotion processing can run asynchronously.
