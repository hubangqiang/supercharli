# Learning Objective Function and Update Gates (SuperCharli)

## Goal
Ensure the learning module improves real outcomes, not just perceived intelligence.

## Objective Function

## Primary Metrics (must improve)
- Action Completion Rate (ACR)
- Recurrence Drop Rate (RDR)

Notes:
- ACR measures whether recommended actions are executed and completed.
- RDR measures whether similar problems recur less frequently.

## Secondary Metrics (must not degrade)
- Persona Consistency Score (PCS)
- Safety Regression Rate (SRR)
- Negative Feedback Rate (NFR)
- Latency Regression (LR)

## Proxy Metrics (for tuning)
- Prompt token usage (avg/percentiles)
- Memory recall hit rate
- Policy update adoption rate

## Learning Event Types
- `skill`: execution strategy learning
- `style`: expression/tone strategy learning
- `identity`: identity-layer learning (low-frequency, strict review)

Rule:
- `skill/style` can update frequently.
- `identity` can only produce candidates; no automatic activation.

## Update Gates

## G0 Data Sufficiency Gate
- Minimum sample size:
  - `skill/style`: >= 30 valid events
  - `identity`: >= 100 valid events + manual review
- If below threshold: block update.

## G1 Quality Gain Gate
- In rolling window (recommended 7 days):
  - ACR improves >= 5%
  - RDR decreases >= 10%
- If either fails: block update.

## G2 Risk Constraint Gate
- PCS must not drop by more than 2%
- SRR must not increase
- NFR must not increase by more than 1%
- Any violation: block update and trigger rollback candidate.

## G3 Stability Gate
- Need 2 consecutive windows passing G1 + G2 before scale-up.
- First rollout only to 10%-20% sessions.

## G4 Merge Gate
- Become default only after successful gray rollout.
- Must emit change record: version, metrics, impact scope, rollback point.

## Rollback Policy
- Trigger conditions (any):
  - SRR increase
  - PCS drop beyond threshold
  - p95 latency exceeds budget
- Rollback requirements:
  - one-step revert to previous policy version
  - preserve failed samples for root-cause review

## Engineering Guidance
- Ship "candidate update + gate evaluation" before auto-activation.
- Decouple metric computation from policy activation to avoid feedback contamination.
- Every learning decision must be traceable (trace id + evidence id).
