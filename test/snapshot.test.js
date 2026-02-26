const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createSnapshot, verifySnapshot, restoreSnapshot } = require("../src/ops/snapshot");

function run() {
  const root = fs.mkdtempSync(path.join(process.cwd(), "tmp-snapshot-test-"));
  const dataDir = path.join(root, "data");
  const docsDir = path.join(root, "docs");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  const dbPath = path.join(dataDir, "supercharli.db");
  fs.writeFileSync(dbPath, "db-v1");
  fs.writeFileSync(path.join(root, "persona.toml"), "name='charli'\n");
  fs.writeFileSync(path.join(docsDir, "note.md"), "snapshot docs\n");

  const created = createSnapshot({ rootDir: root, dbPath });
  assert.ok(fs.existsSync(path.join(created.snapshotDir, "manifest.json")), "manifest should exist");

  const manifest = verifySnapshot(created.snapshotDir);
  assert.ok(manifest.files.length >= 2, "snapshot should include files");

  fs.writeFileSync(dbPath, "db-v2");
  restoreSnapshot({ rootDir: root, snapshotDir: created.snapshotDir, dbPath });
  const restored = fs.readFileSync(dbPath, "utf8");
  assert.strictEqual(restored, "db-v1", "db should be restored from snapshot");

  fs.rmSync(root, { recursive: true, force: true });
  console.log("snapshot tests: PASS");
}

run();
