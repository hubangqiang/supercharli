# Acceptance Criteria (V1)

## Functional
- Multi-turn continuity works across at least 10 consecutive turns in one session.
- Persona consistency holds under normal route and fallback route.
- L1 write/read loop works in-session with no missing critical context.
- L1->L2 auto-promotion is triggered by repeated qualified patterns.
- L2 recall improves repeated-problem guidance quality.
- S1/S2/S3 transitions are observable and TTL-based return works.
- At least two external models produce identity-consistent outputs.
- Fallback chain returns usable output when primary route fails.

## Quality Targets
- Latency:
  - default route P50 <= 2.0s,
  - default route P95 <= 6.0s,
  - deep route P95 <= 10.0s.
- Reliability:
  - fallback success rate >= 99% for injected primary-failure tests.
  - critical persona violation rate = 0 in acceptance suite.
- Memory quality:
  - false-promotion rate <= 5% in evaluation set.
  - repeated-problem improvement rate >= 20% vs first encounter baseline.

## Acceptance Method
- Run scripted scenarios from `docs/plans/demo-script.md`.
- Execute two full validation rounds on different days.
- Compare outcomes against quality targets and log evidence.

## Exit Conditions
- All functional criteria pass.
- Quality targets pass for 2 consecutive rounds.
- No unresolved blocker risks remain in `docs/plans/risk-register.md`.
- Scope remains compliant with `docs/plans/scope.md`.
