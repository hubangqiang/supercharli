#!/usr/bin/env node
const path = require("path");
const { restoreSnapshot } = require("../src/ops/snapshot");
const { getDefaultDbPath } = require("../src/runtime/runtimePaths");

function main() {
  const rootDir = process.cwd();
  const snapshotDir = process.argv[2];

  if (!snapshotDir) {
    console.error("Usage: npm run restore -- /absolute/or/relative/snapshot-dir");
    process.exit(1);
  }

  const dbPath = getDefaultDbPath(process.env);
  const result = restoreSnapshot({
    rootDir,
    snapshotDir: path.resolve(rootDir, snapshotDir),
    dbPath,
  });

  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main();
