# Backup & Restore Playbook

## Backup Policy
- Frequency:
  - daily incremental snapshot,
  - weekly full snapshot.
- Retention:
  - daily backups: 14 days,
  - weekly backups: 8 weeks.
- Scope:
  - memory/state snapshot,
  - governance docs,
  - runtime policy configuration,
  - version manifest.

## Backup Procedure
1. Enter snapshot-safe mode or pause mutating writes.
2. Capture state bundle and manifest checksum.
3. Validate integrity before marking backup successful.
4. Record backup metadata in operation log.

## Restore Procedure
1. Restore to isolated staging first.
2. Run integrity and smoke checks.
3. Validate persona and memory consistency.
4. Promote to active only after checks pass.

## Verification Checklist
- Charter/persona load succeeds.
- L1/L2 readable and coherent.
- Basic conversation and recall flow works.
- Route/fallback behavior is operational.
