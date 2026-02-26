# Model Routing Policy

## Objective
Select model depth by task complexity while preserving identity consistency.

## Route Types
- Fast Route: default for interactive latency.
- Deep Route: for complex multi-step reasoning.

## Route Selection
Choose Deep Route when any condition matches:
- explicit deep reasoning request,
- high-stakes decision tradeoff,
- complex multi-constraint planning.
Otherwise use Fast Route.

## Guardrail Rule
Routing changes reasoning depth only.
It must not change persona constraints or memory governance.

## Cost and Latency Guardrails
- Fast route is default.
- Deep route escalation should be purposeful and bounded.
- Route decision and latency must be logged for tuning.

## Output Consistency
Both routes must satisfy same response contract.
