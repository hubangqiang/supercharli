# Model Augmentation Boundary Principle

## Position
SuperCharli is an augmentation and governance layer for large models, not a replacement for model intelligence.

## Core Boundary
1. External models remain responsible for reasoning, generation, and fast capability evolution.
2. Local SuperCharli runtime remains responsible for continuity, governance, and durable alignment.

## Why Local Memory Exists
- Preserve continuity across sessions and model switches.
- Recover key context when model-side conversation memory is unavailable.
- Store only high-value, reusable signals for future decisions.

## What Is Suitable for Long-Term Memory
- Stable user preferences and durable goals.
- Repeated patterns with verified outcomes.
- Milestones and identity-level constraints.
- Proven strategies with clear completion signals.

## What Is Not Suitable
- Disposable small talk.
- Temporary emotional noise without decision value.
- Unverified conclusions.
- Time-sensitive facts that quickly expire.

## Learning Boundary
- Local learning is a filter, not model pretraining.
- The learner extracts candidate signals from interactions under explicit gates.
- Activation must remain auditable, reversible, and rollback-safe.

## One-Line Rule
SuperCharli does not replace model intelligence; it stabilizes, governs, and amplifies model collaboration quality over time.
