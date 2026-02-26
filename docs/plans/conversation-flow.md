# Conversation Flow

## Goal
Define an implementation-ready runtime flow for V1.

## Pipeline
1. Ingest
2. Guard
3. Recall
4. Route
5. Generate
6. Normalize
7. Persist
8. Evaluate

## Stage Contracts
### 1) Ingest
- Input: raw user message + session id + timestamp.
- Output: normalized request object.
- Failure: malformed payload -> return safe error response.

### 2) Guard
- Apply persona priority rules before any model call.
- Determine severity mode: Normal/S1/S2/S3.
- Output: guarded context + severity mode.

### 3) Recall
- Retrieve bounded memory slice:
  - L1 recent relevant context.
  - L2 top patterns by relevance.
- Output: recall pack with fixed max budget.

### 4) Route
- Select model path (fast/deep) from routing policy.
- Attach fallback chain metadata.

### 5) Generate
- Execute single model call under route timeout.
- Capture structured generation result and metadata.

### 6) Normalize
- Enforce response contract:
  - conclusion,
  - next action,
  - completion signal,
  - optional fallback option.
- Reject output that violates persona constraints.

### 7) Persist
- Write session result into L1.
- Emit L2 promotion candidate if trigger conditions are met.

### 8) Evaluate
- Log route, latency, severity transition, memory decisions.
- Return final response to user.

## Decision Table
- Objective unclear -> ask one clarifying question.
- Severity high (S3) -> prioritize risk containment response.
- Model timeout/error -> enter fallback policy.
- Memory conflict -> prefer safer interpretation + log conflict.

## Non-Functional Limits
- Keep sync path minimal.
- Promotion evaluation can be asynchronous after response return.
