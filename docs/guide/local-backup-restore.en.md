# Local Backup and Restore

## Goal
Ensure local memory is portable and recoverable.

## Backup
```bash
npm run backup
```
Default output is under `~/supercharli-runtime/backups`.

## Restore
```bash
npm run restore -- <snapshot-dir>
```
Restore validates manifest checksum before replacing DB.

## Post-Restore Check
- `npm test`
- `npm run demo`
