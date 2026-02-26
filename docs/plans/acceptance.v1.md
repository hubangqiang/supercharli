# Acceptance Criteria (V1)

## Functional
- Supports continuous multi-turn dialogue with coherent context carryover.
- Produces responses that remain consistent with SuperCharli constitution and charter.
- Stores session memory (L1) and retrieves relevant L1 items within the same session.
- Promotes repeated high-value patterns from L1 into L2 without manual approval.
- Uses L2 patterns to improve future responses on repeated problems.
- Triggers emergency modes (S1/S2/S3) from serious session events and returns to normal mode after TTL.
- Maintains identity consistency across at least two different external models.
- Falls back to the next model in chain when the current model is unavailable.

## Quality
- P50 response latency on default path stays within agreed budget (target: fast interactive response).
- No critical persona violations in acceptance scenarios.
- No loss of core state after restart in normal operation.
- Memory writes are traceable at decision level (why stored, why promoted).
- Behavior changes caused by promoted memory are inspectable and reversible.

## Exit Conditions
- All functional criteria pass in scripted acceptance scenarios.
- Quality criteria meet baseline thresholds for two consecutive validation runs.
- V1 scope remains unchanged during final validation window.
- Known non-blocking issues are documented with explicit follow-up owners.
