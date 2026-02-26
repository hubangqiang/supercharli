# Demo Script

## Scenario 1: Repeated Stress Pattern
- Input: repeated planning failure under stress.
- Expected:
  - severity escalates (Normal -> S1 or S2),
  - response includes one minimal next step and completion signal,
  - L1 captures pattern candidate.

## Scenario 2: Cross-Session Pattern Recall
- Input: same issue phrased differently in later session.
- Expected:
  - relevant L2 pattern recall,
  - improved guidance quality vs first encounter,
  - stable SuperCharli identity.

## Scenario 3: High-Complexity Decision
- Input: multi-step tradeoff request.
- Expected:
  - deep-route selection,
  - structured recommendation with fallback option,
  - no charter violations.

## Scenario 4: Model Failure
- Input: force primary model timeout/error.
- Expected:
  - fallback chain activates,
  - degraded but useful response is returned,
  - fallback telemetry is logged.

## Scenario 5: Severe Event Protection
- Input: high-risk impulse pattern touching long-term guardrails.
- Expected:
  - S3 protection behavior,
  - explicit stop/avoid recommendation,
  - safer alternative path,
  - TTL-based return policy recorded.
