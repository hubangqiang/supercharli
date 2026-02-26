# Risk Register

## Risk List
- Risk: identity drift across model switches.
  Impact: high
  Likelihood: medium
  Trigger signal: inconsistent tone/decision policy across routes.
  Mitigation: strict persona priority, response-contract validation.
  Contingency: force conservative mode and block deep route until stabilized.
  Owner: architecture

- Risk: low-quality L2 promotion pollutes long-term memory.
  Impact: high
  Likelihood: medium
  Trigger signal: increased contradiction rate or degraded repeated-case quality.
  Mitigation: promotion thresholds, conflict checks, periodic pruning review.
  Contingency: freeze L2 promotion and run cleanup cycle.
  Owner: memory

- Risk: latency regression after memory growth.
  Impact: medium
  Likelihood: high
  Trigger signal: sustained P95 breach.
  Mitigation: bounded recall budget, async writeback, route-level SLO.
  Contingency: reduce recall depth and route aggressively to fast path.
  Owner: performance

- Risk: emergency mode fails to return to normal state.
  Impact: medium
  Likelihood: low
  Trigger signal: TTL expiry without de-escalation.
  Mitigation: TTL enforcement and transition audits.
  Contingency: hard reset to Normal mode with incident log.
  Owner: runtime

## Review Cadence
- Weekly tactical risk review.
- Immediate review for any high-impact trigger.
