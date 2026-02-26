# Memory Evaluation

## Evaluation Objective
Ensure memory growth improves decision quality without identity drift.

## Core Metrics
- Repeated-problem improvement rate.
- Action follow-through rate after guidance.
- Recall relevance precision.
- False-promotion rate.
- Contradiction resolution quality.

## Evaluation Dataset
- At least 20 repeated-pattern cases.
- At least 10 contradiction-injection cases.
- At least 10 severe-event cases with TTL return checks.

## Test Protocol
1. Run baseline without L2 recall.
2. Run with L2 recall enabled.
3. Compare quality deltas and error classes.
4. Record promotion errors and root causes.

## Decision Rules
- Keep policy if quality gains are positive and stable.
- Tune promotion thresholds if false-promotion rises above target.
- Trigger incident review on any critical persona/safety memory failure.
