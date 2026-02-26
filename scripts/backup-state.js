#!/usr/bin/env node
const { createSnapshot } = require("../src/ops/snapshot");
const { getDefaultDbPath, getDefaultBackupDir } = require("../src/runtime/runtimePaths");

function main() {
  const rootDir = process.cwd();
  const dbPath = getDefaultDbPath(process.env);
  const snapshotRoot = getDefaultBackupDir(process.env);

  const result = createSnapshot({ rootDir, dbPath, snapshotRoot });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main();
