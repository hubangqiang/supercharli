#!/usr/bin/env node
const path = require("path");
const { createSnapshot } = require("../src/ops/snapshot");

function main() {
  const rootDir = process.cwd();
  const dbPath = process.env.SUPERCHARLI_DB_PATH || path.join(rootDir, "data", "supercharli.db");
  const snapshotRoot = process.env.SUPERCHARLI_BACKUP_DIR || path.join(rootDir, "backups");

  const result = createSnapshot({ rootDir, dbPath, snapshotRoot });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main();
