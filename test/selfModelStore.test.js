const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { SQLiteSelfModelStore } = require("../src/mind/sqliteSelfModelStore");

function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-self-model-"));
  const dbPath = path.join(tmp, "mind.db");

  const a = new SQLiteSelfModelStore({ dbPath, scope: "main" });
  const first = a.read();
  assert.strictEqual(first.stage, "apprentice");
  a.write({ stage: "transfer", gatePassCount: 3, lastAuditStatus: "healthy" });
  a.close();

  const b = new SQLiteSelfModelStore({ dbPath, scope: "main" });
  const second = b.read();
  assert.strictEqual(second.stage, "transfer");
  assert.strictEqual(second.gatePassCount, 3);
  assert.strictEqual(second.lastAuditStatus, "healthy");
  b.close();

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("self model store tests: PASS");
}

run();
