const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");

function runInMemoryCheck() {
  const m = new InMemoryMemoryEngine();
  const ok = m.upsertL2Pattern({
    key: "testcase-3part-template",
    summary: "测试用例模板：步骤+预期+实际",
    strategy: "先写步骤，再写预期，再记录实际",
    confidence: 0.88,
    source: "model-extracted",
  });
  assert.strictEqual(ok, true);
  const recalled = m.recallL2("测试用例模板");
  assert.ok(recalled.length >= 1);
  assert.strictEqual(recalled[0].key, "testcase-3part-template");
}

function runSqliteCheck() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-l2-upsert-"));
  const dbPath = path.join(tmp, "memory.db");
  const m = new SQLiteMemoryEngine({ dbPath });
  const ok = m.upsertL2Pattern({
    key: "testcase-3part-template",
    summary: "测试用例模板：步骤+预期+实际",
    strategy: "先写步骤，再写预期，再记录实际",
    confidence: 0.88,
    source: "model-extracted",
  });
  assert.strictEqual(ok, true);
  const recalled = m.recallL2("测试用例模板");
  assert.ok(recalled.length >= 1);
  assert.strictEqual(recalled[0].key, "testcase-3part-template");
  m.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  runInMemoryCheck();
  runSqliteCheck();
  console.log("memory upsert signal tests: PASS");
}

run();
