# Risk Register

## Risk List
- Risk: identity drift across model switches.
  Impact: high
  Likelihood: medium
  Mitigation: strict persona runtime priority and response contract checks.
  Owner: architecture

- Risk: low-quality L2 promotion pollutes long-term memory.
  Impact: high
  Likelihood: medium
  Mitigation: promotion thresholds, conflict checks, periodic pruning review.
  Owner: memory

- Risk: latency regression after memory growth.
  Impact: medium
  Likelihood: high
  Mitigation: bounded recall budget, async writeback, route-level latency SLO.
  Owner: performance

- Risk: emergency mode fails to return to normal state.
  Impact: medium
  Likelihood: low
  Mitigation: TTL enforcement and transition audits.
  Owner: runtime
