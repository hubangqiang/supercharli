# Runtime Components (V1)

## Objective
Define implementation boundaries so coding can start without architectural ambiguity.

## Component 1: Kernel
### Responsibility
- Own end-to-end request lifecycle orchestration.
- Execute stage order and enforce stage contracts.

### Inputs
- normalized request
- session context handle

### Outputs
- normalized response
- execution metadata

### Must Not
- contain model-specific policy logic
- directly mutate long-term memory without memory engine contract

## Component 2: Persona Guard
### Responsibility
- Enforce charter/constitution runtime constraints.
- Validate and gate model output.

### Inputs
- candidate response
- severity mode
- persona policies

### Outputs
- approved response or regenerate decision

### Must Not
- decide model route
- persist memory directly

## Component 3: Memory Engine
### Responsibility
- Manage L1 read/write and L2 promotion pipeline.
- Resolve memory conflicts and apply pruning rules.

### Inputs
- session events
- promotion candidates
- recall queries

### Outputs
- bounded recall pack
- write results and promotion decisions

### Must Not
- bypass local sovereignty constraints
- leak prohibited sensitive raw data into L2

## Component 4: Model Router
### Responsibility
- Select fast/deep route.
- Execute fallback chain on route failure.

### Inputs
- request complexity and policy context

### Outputs
- model selection decision
- generation result metadata

### Must Not
- alter persona priority rules
- write memory decisions

## Component 5: Response Normalizer
### Responsibility
- Convert model output into response contract structure.

### Inputs
- model output
- runtime context

### Outputs
- final structured response

### Must Not
- suppress critical uncertainty or policy violations

## Component 6: Severity Controller
### Responsibility
- Run Normal/S1/S2/S3 transitions and TTL de-escalation.

### Inputs
- risk signals
- transition history

### Outputs
- current severity mode
- transition events

### Must Not
- permanently mutate core temperament

## Component 7: Observability Layer
### Responsibility
- Emit logs, metrics, and trace linkage.

### Inputs
- stage events and outcomes

### Outputs
- queryable telemetry artifacts

### Must Not
- contain business decision logic

## Integration Rules
- Components communicate through explicit contracts only.
- No cross-component hidden state.
- All critical decisions must be observable and replayable.

## Minimal Build Order
1. Kernel + Response Normalizer
2. Persona Guard
3. Memory Engine (L1 first)
4. Model Router + Fallback
5. Severity Controller
6. Observability Layer
7. Memory Engine L2 promotion and pruning
