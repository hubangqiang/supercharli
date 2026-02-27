const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");

function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-sqlite-migration-"));
  const dbPath = path.join(root, "memory.db");

  // Simulate legacy schema without strength/confidence columns.
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE l2_patterns (
      key TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      strategy TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.close();

  const engine = new SQLiteMemoryEngine({ dbPath });
  const promoted = engine.evaluatePromotion({ text: "我持续拖延，需要马上执行", severity: "s2" });
  assert.strictEqual(typeof promoted, "boolean");

  const recalled = engine.recallL2("procrastination-loop");
  assert.ok(Array.isArray(recalled));
  engine.close();

  fs.rmSync(root, { recursive: true, force: true });
  console.log("sqlite memory migration tests: PASS");
}

run();
