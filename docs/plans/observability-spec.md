# Observability Spec

## Logging Requirements
- Request lifecycle log for each turn:
  - ingest, guard, recall, route, generate, normalize, persist.
- Memory decision log:
  - recall candidates,
  - promotion decision and reason,
  - conflict handling result.
- Severity transition log:
  - previous mode,
  - new mode,
  - trigger reason,
  - expected TTL exit.

## Metrics Baseline
- Latency: P50/P95 by route type.
- Reliability: model error rate, fallback activation rate, fallback success rate.
- Memory: L1 write count, L2 promotion count, promotion rejection count.
- Safety: persona violation count, high-risk output rejection count.
- Severity: mode distribution, average time in S1/S2/S3.

## Tracing Contract
- Every user turn has a unique trace id.
- Trace id links request, route decision, memory decisions, response.
- Critical failures must be replayable from trace artifacts.

## Alert Rules (V1)
- Alert on sustained P95 latency breach for 15 minutes.
- Alert on fallback success drop below 95%.
- Alert on any critical persona violation event.
