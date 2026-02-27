const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");

function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-recon-"));
  const dbPath = path.join(root, "memory.db");
  const now = new Date().toISOString();

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE l2_patterns (
      key TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      strategy TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db.prepare(`
    INSERT INTO l2_patterns (key, summary, strategy, updated_at)
    VALUES (?, ?, ?, ?)
  `).run("procrastination-loop", "legacy summary", "legacy strategy", now);
  db.close();

  const engine = new SQLiteMemoryEngine({ dbPath, threshold: 1, recallLimit: 10 });
  assert.strictEqual(engine.recallLimit, 5, "recall limit should be clamped to max 5");

  const promoted = engine.evaluatePromotion({
    text: "我还是拖延，必须开始执行第一个动作",
    severity: "s2",
  });
  assert.strictEqual(promoted, true);

  const check = new DatabaseSync(dbPath);
  const l2 = check
    .prepare(`SELECT summary, strategy FROM l2_patterns WHERE key = 'procrastination-loop'`)
    .get();
  const c = check
    .prepare(`SELECT COUNT(*) AS n FROM memory_reconsolidation_candidates WHERE key = 'procrastination-loop'`)
    .get();
  check.close();

  assert.strictEqual(l2.strategy, "legacy strategy", "active strategy should not be overwritten directly");
  assert.ok(c.n >= 1, "should create reconsolidation candidate");

  engine.close();
  fs.rmSync(root, { recursive: true, force: true });
  console.log("memory reconsolidation tests: PASS");
}

run();
