# Memory Policy

## L1 Rules
- L1 is session-scoped working memory for active dialogue continuity.
- L1 may contain uncertain hypotheses, but each item must carry confidence context.
- L1 stores only decision-relevant context, not all conversational noise.
- L1 should answer three questions at any point:
  - what is the current objective,
  - what is the next action,
  - what is the completion signal.

## L2 Rules
- L2 is long-term memory for durable, reusable behavior-result patterns.
- L2 is local-sovereign and model-independent.
- L2 must not store raw secrets, transient emotions, or unverified accusations.
- L2 must preserve core temperament constraints.

## Promotion / Pruning
- Promotion trigger (default): repeated high-value pattern appears >= 3 times within a practical window.
- Promotion path: L1 event -> candidate summary -> conflict check -> L2 write.
- Promotion criteria:
  - future decision utility,
  - recurrence across contexts,
  - consistency with charter constraints.
- Pruning policy:
  - stale low-value L2 entries are down-ranked,
  - contradictory entries are condition-scoped or revised,
  - irreversible deletion is avoided when archival is possible.
