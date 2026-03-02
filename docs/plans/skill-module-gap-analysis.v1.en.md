# Skill Module Gap Analysis v1 (EN)

Reference spec: `docs/plans/skill-module-spec.v1.en.md`

## Overview
Current implementation already includes injection observability, managed skill store, quality feedback, and early lifecycle downgrade behavior. Full release-governance lifecycle is not yet complete.

## A. Completed
1. Skill vs Memory separation
- Skill store is separated from L1/L2 memory stores.

2. Meta routing baseline
- Model-first skill selection exists, with local fallback.

3. User-invisible behavior
- Chat path is default-hidden for lifecycle/routing internals.

4. Basic quality loop
- Per-turn quality scoring and one quality-repair retry.
- Skill usage updates quality score and supports active -> shadow downgrade.

5. Baseline observability
- Observer shows injection catalog/history and managed skill catalog/history.

## B. Partially Completed
1. Lifecycle coverage incomplete
- active/shadow exists; candidate/deprecated/archived flow is not fully operational.

2. Version governance incomplete
- version field exists; release records, version compare, and rollback chain are missing.

3. Quality metrics depth incomplete
- Mostly per-turn score; missing per-skill trend, scenario slices, and drift checks.

4. Router explainability limited
- Route reason exists but lacks structured selected/not-selected rationale.

5. Budget governance incomplete
- injectionBudget exists but no global scheduling and compression strategy.

## C. Not Completed (v2 priorities)
1. Release pipeline
- candidate -> shadow -> active gate automation and review actions.

2. Skill dedup/merge
- Semantic duplicate detection and merge migration.

3. Deprecation/archive policy
- Trigger rules, retention policy, and restore path.

4. Safety/compliance governance
- Dedicated audit and deny controls for high-risk skills.

5. Skill-level experiments
- Session/user split test for new skill versions.

## D. Recommended Next Steps
1. Build release pipeline first (candidate/shadow/active).
2. Add versioned release and rollback records.
3. Add skill quality trend dashboards and threshold alerts.
4. Add deprecation/archive and merge workflows.

