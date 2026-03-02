# Skill Module Product Spec v1 (EN)

## 1. Goal
The Skill module stores reusable method capabilities and injects them on demand into external models to improve consistency and execution quality.

Constraints:
- LLM-first: reasoning, abstraction, extraction, and selection should be model-led.
- Local governance: local runtime handles storage, gating, versioning, observability, and rollback.
- User-invisible: skill lifecycle and internals must not be exposed in normal chat.

## 2. Core Definitions
### 2.1 Skill vs Memory
- Skill: reusable method asset (for example, "three-part test case writing method").
- Memory: factual experience asset (for example, "you wrote registration test cases before").

Rules:
- Skill must not become fixed business answers.
- Memory must not replace method abstraction.

### 2.2 Skill Types
- foundation: identity/safety/style boundary capabilities.
- domain: task methods (testing, planning, review, delivery, etc.).
- meta: system capabilities (skill extraction, routing, injection control).

## 3. Always-On Meta Capabilities
Two meta skills are always active:
- `skill-extractor`: detects "user teaching intent" and extracts candidate skills.
- `skill-router`: selects on-demand skills and controls injection budget.

These are internal mechanisms and are not shown in user-facing chat.

## 4. Lifecycle
Lifecycle states:
- candidate
- shadow
- active
- deprecated
- archived

Transitions:
- candidate -> shadow after baseline gates pass
- shadow -> active when stable quality is reached
- active -> shadow/deprecated when quality degrades or risk rises
- deprecated -> archived when obsolete

## 5. Data Model (Required Dimensions)
Each skill should include:
- Identity: `skillId`, `title`, `version`
- Capability: `skillType`, `applicability`, `method`, `boundaries`
- Routing: `scenarioTags`, `injectionBudget`
- Quality: `qualityScore`, `successCount`, `failCount`, `useCount`
- Lifecycle: `lifecycle`, `status`, `createdAt`, `updatedAt`, `lastUsedAt`
- Provenance: `source` (model-extracted / manual / merged)

## 6. Injection Strategy
### 6.1 Baseline
- foundation is always injected in a small budget.
- domain is selected on demand, default max 2.
- meta operates internally and is not exposed in final answer.

### 6.2 Budget
- Skill injection must respect token budget.
- Under budget pressure, keep higher-quality and higher-relevance skills first.

### 6.3 Fallback
- If model-based skill routing fails, local recall fallback is allowed.
- Fallback must stay traceable and must not permanently override model routing.

## 7. Quality Loop
After each turn, evaluate:
- pass/fail
- score (0-1)
- issues (labels)

Use outputs to:
- trigger one quality-repair retry when needed
- update skill quality metrics
- drive lifecycle downgrade (for example, active -> shadow)

## 8. Invisible Mechanism Constraint
Do not expose in normal chat:
- skill routing details, lifecycle states, prompt pack names
- governance internals, quality labels, policy version details

Allowed:
- natural user-facing phrasing that supports execution quality without exposing internals.

## 9. Management and Observability
Observer must show:
- injection layer: current injected packs and injection history
- managed layer: skill library, usage history, quality trends, lifecycle states

Chat UI should remain default-hidden for internals.

## 10. v1 Acceptance
- User-facing: no internal mechanism leakage in chat
- Quality: upward trend on repeated task classes
- Cost: controlled token overhead
- Governance: support publish, downgrade, rollback, archive

