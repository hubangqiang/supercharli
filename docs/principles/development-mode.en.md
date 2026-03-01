# SuperCharli Development Mode

## Core Position
SuperCharli must not become a local pseudo-model.
It is a local data and governance layer that amplifies external model capability.

## Responsibility Split
1. External model:
- Understanding, reasoning, synthesis, generation.
- Capability upgrades over time.

2. Local runtime:
- Data sovereignty (memory stays local).
- Standard injection (persona, constraints, methods, domain standards).
- Learning filtering (gate, audit, rollback), not model pretraining replacement.
- Cross-session and cross-model continuity.

## Engineering Rules
1. Prompt and context first:
- Keep reusable standards as local structured data.
- Inject standards on-demand into model context by relevance.
- Never hardcode domain answers as local templates.

2. Data first:
- Store durable, reusable, verifiable signals.
- Avoid storing disposable chatter and unstable noise.

3. Policy first:
- Local logic should enforce quality and safety gates.
- Every learning activation must be explainable and reversible.

4. Model-agnostic first:
- Same local memory and standards must work across providers.
- Provider swaps should not break identity continuity.

## Anti-Pattern Checklist
Do not implement these as default behavior:
- Local fixed-answer scripts pretending to be learning.
- Local deterministic Q&A replacing model reasoning.
- Persona/style hardcoding that bypasses model generation.

## One-Line Principle
SuperCharli local code governs data and continuity; model intelligence remains in external large models.
