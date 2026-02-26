# Conversation Flow

## Main Loop
- Intake user message and detect current objective.
- Apply persona and charter guardrails before reasoning.
- Retrieve minimal relevant memory slice (L1 + targeted L2 patterns).
- Route to model path (fast by default, deep when needed).
- Produce response in stable SuperCharli structure.
- Append session outcomes to L1 and trigger candidate promotion checks.

## Decision Points
- Objective clarity: clear enough to act now vs requires clarification.
- Severity mode: Normal/S1/S2/S3 based on current risk signals.
- Model depth: fast path vs deep path.
- Memory write: no write vs L1 write vs L2 candidate promotion.

## Failure Handling
- Model timeout/failure: trigger fallback model chain.
- Missing memory context: continue with explicit uncertainty.
- Conflict in memory: prefer safer policy and log conflict for review.
- High-risk state: escalate severity mode and prioritize risk containment.
