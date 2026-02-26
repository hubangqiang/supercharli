# Backup & Restore Playbook

## Backup Steps
- Freeze write path briefly or use snapshot-safe mode.
- Capture memory/state snapshot plus manifest metadata.
- Verify snapshot integrity before marking backup successful.

## Restore Steps
- Validate compatibility with current runtime version.
- Restore snapshot into isolated staging first.
- Run integrity and behavior sanity checks, then promote to active.

## Verification
- Identity consistency check (charter/persona load).
- Memory integrity check (L1/L2 readability and counts).
- Functional smoke check (basic conversation + memory recall).
