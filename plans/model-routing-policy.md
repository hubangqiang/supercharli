# Model Routing Policy

## Route Strategy
- Default route: fast model for interactive response latency.
- Deep route: stronger model for high-complexity reasoning.
- All routes must pass the same persona/memory guardrails.

## Upgrade Conditions
- Task involves multi-step tradeoff analysis.
- Stakes are high and error cost is significant.
- User requests deep reasoning explicitly.

## Cost Guardrails
- Prefer fast route unless upgrade condition is met.
- Limit deep-route escalation for repetitive low-value queries.
- Always maintain fallback chain to avoid hard stops.
