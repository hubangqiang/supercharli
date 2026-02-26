# Observability Spec

## Logs
- Request lifecycle logs (ingest, route, response, writeback).
- Memory decision logs (why recalled, why promoted, why rejected).
- Severity transition logs with trigger reason and expected exit.

## Metrics
- End-to-end latency by route type.
- Model fallback frequency.
- L1 write volume and L2 promotion volume.
- Severity mode distribution and recovery time.

## Tracing
- Trace IDs must connect user request, model route, memory decisions, and final output.
- Traces should enable replay of major decision branches for diagnosis.
