# Human-Like Memory Architecture Blueprint (SuperCharli)

## Goal
Move SuperCharli from "store more data" to a human-like dynamic memory system:
- Forgetting: low-value signals fade over time.
- Reconsolidation: recalled memories can be updated with traceability.
- Self-narrative: personality and long-term memory shape each other.
- Safety and control: human-like behavior without fabrication or boundary drift.

## Layered Model (L0-L4)

## L0 Sensory Trace (Transient)
- Purpose: capture immediate input cues, emotional intensity, and context features.
- Retention: non-persistent by default.
- Constraint: cannot be promoted directly to long-term memory.

## L1 Episodic Memory (Session)
- Purpose: preserve recent event flow and action chain.
- Content: event, decision, action, outcome, affect intensity, timestamp.
- Lifecycle: high-detail short horizon with bounded rolling retention.

## L2 Pattern Memory (Cross-Session)
- Purpose: reusable behavior-outcome patterns.
- Content: trigger condition, common failure mode, effective strategy, scope boundary.
- Promotion: from L1 candidates through scoring + conflict checks.

## L3 Autobiographical Memory (Life Phases)
- Purpose: major transitions, long arcs, identity narrative continuity.
- Content: phase goals, turning points, phase conclusions, continuity anchors.
- Character: low-frequency updates, high explanatory value.

## L4 Identity Memory (Core Persona)
- Purpose: stable values, persona baseline, non-negotiable guardrails.
- Content: role definition, behavior principles, safety boundaries, mission.
- Character: most stable layer; updates must be auditable and reversible.

## Memory Lifecycle
1. Encode: input enters L0 and key signals are extracted.
2. Write: decision-relevant events are written to L1.
3. Candidate: L1 events become L2/L3 candidates.
4. Consolidate: offline job promotes or down-ranks candidates.
5. Recall: bounded high-value memory pack enters current reasoning.
6. Reconsolidate: recalled items can generate update candidates.
7. Decay/Archive: low-value items are down-ranked and reversibly archived.

## Promotion and Forgetting

## Promotion Scoring (instead of fixed threshold)
- Dimensions:
  - recurrence over time
  - impact on decisions/outcomes
  - cross-scenario reusability
  - evidence quality (verifiable result)
  - conflict risk with existing memory
- Promotion to L2/L3 happens only when score crosses threshold.

## Forgetting and Down-Ranking
- Track memory `strength` with time-based decay.
- Reinforce strength only when recalled and validated as useful.
- Prefer reversible archive over hard deletion.

## Reconsolidation Safety (anti-memory-pollution)
- Recalled memories are never overwritten directly.
- New information enters an update-candidate queue first.
- Merge only after conflict checks; retain full version chain.

## Recall Strategy (human-like but controlled)
- Recall budget: max 3-5 high-value memories per turn.
- Retrieval signals:
  - semantic relevance
  - recency
  - memory strength
  - current severity mode (S0-S3)
  - goal fit
- Re-ranking objective: optimize actionable value, not literal keyword overlap.

## Consolidation Job (offline "sleep")
- Cadence: daily or every N hours.
- Tasks:
  - compress L1 into L2/L3 candidates
  - conflict and boundary checks
  - down-rank/archive low-value records
  - produce human-readable memory change log

## Compatible Evolution Path

## Phase 1 (minimum viable)
- Add to existing L1/L2:
  - promotion scoring
  - memory strength + decay
  - recall budget (3-5)

## Phase 2 (mid-term)
- Add:
  - reconsolidation candidate queue
  - L3 autobiographical tables
  - retrieval re-ranking

## Phase 3 (advanced)
- Add:
  - vector retrieval
  - scheduled consolidation orchestration
  - memory quality metrics dashboard

## Data Sovereignty and Portability
- All memory remains local-first; no hidden provider memory dependency.
- Export/import must preserve versions and metadata.
- After migration, memory evolution should remain replayable.

## Acceptance Criteria (Human-Like Memory)
- Consistency: similar persona judgment across model switches.
- Explainability: each key recommendation traces to memory evidence.
- Evolvability: major events can shift style weights without breaking core identity.
- Recoverability: migration preserves memory capability and persona continuity.
