# Migration Playbook

## Export
- Export local state bundle with manifest and version markers.
- Include governance docs, memory state, and policy configuration.
- Exclude machine-local secrets from portable bundle.

## Import
- Validate bundle schema and version compatibility.
- Map environment-specific paths and runtime settings.
- Rebuild required indexes/caches before production use.

## Compatibility Checks
- Persona and charter parity check.
- Memory engine version compatibility check.
- Route and fallback policy compatibility check.
