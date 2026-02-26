# Scope (V1)

## In Scope
- Stable multi-turn conversation.
- Consistent persona behavior aligned with local constitution and charter.
- Local memory with two levels: L1 (session) and L2 (long-term).
- Automatic L1 to L2 promotion for repeated high-value patterns.
- Temporary emergency mode (S1/S2/S3) with automatic return to normal mode.
- External model integration with a single SuperCharli identity across models.
- Basic model routing: default fast path, selective deep path, fallback chain.
- Local-first state ownership with export/import-ready lifecycle design.

## Out of Scope
- Any direct external actions (no command execution, no software operation automation).
- Tool-use autonomy (no browser automation, no filesystem mutation by agent decisions).
- Complex multi-agent production orchestration.
- Full enterprise auth/permissions platform.
- Advanced multimodal features (image/audio/video reasoning pipelines).
- UI-heavy productization beyond a minimal interaction interface.

## Constraints
- Persona and memory sovereignty must remain local.
- Core temperament is stable: optimistic, long-term oriented, pragmatic, exploratory.
- Long-term guardrails are non-negotiable: health, reputation, compounding.
- V1 must favor low latency and deterministic behavior over feature breadth.
- Any behavior evolution must be explainable, reversible, and auditable.
