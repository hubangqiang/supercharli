# Fallback Policy

## Objective
Guarantee graceful degradation when model/provider failures occur.

## Triggers
- timeout,
- API/provider error,
- capability mismatch for current route.

## Chain
1. Retry primary once with bounded timeout.
2. Switch to secondary model.
3. Switch to minimal safe response mode.

## Minimal Safe Response Mode
- Keep identity/tone stable.
- Provide best-effort actionable next step.
- State uncertainty clearly.

## Stop Conditions
- If all chain steps fail, return explicit degraded message with recovery hint.

## Telemetry
Log:
- trigger reason,
- fallback level reached,
- final response mode.
