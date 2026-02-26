# Migration Playbook

## Migration Goal
Move SuperCharli state between environments without identity drift or memory corruption.

## Export Procedure
1. Freeze mutating writes.
2. Export state bundle with manifest.
3. Exclude machine-local secrets.
4. Sign or checksum bundle.

## Import Procedure
1. Validate manifest schema and version compatibility.
2. Map environment-specific runtime values.
3. Import into staging.
4. Rebuild indexes/caches.
5. Run compatibility smoke tests.

## Compatibility Gates
- Product principles parity check.
- Memory engine version compatibility.
- Routing/fallback policy compatibility.
- Acceptance smoke script pass.

## Rollback Rule
- If any compatibility gate fails, abort promotion and keep prior active state.
