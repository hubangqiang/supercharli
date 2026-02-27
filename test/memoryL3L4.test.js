const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");

function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-l3l4-"));
  const dbPath = path.join(tmp, "memory.db");
  const memory = new SQLiteMemoryEngine({ dbPath });

  memory.writeL3Milestone({
    phase: "exam-phase",
    eventSummary: "Repeated exam pressure detected",
    lesson: "Use weekly plan + daily execution checkpoint",
    confidence: 0.8,
  });
  const l3 = memory.readL3Milestones(5);
  assert.ok(l3.length >= 1, "l3 milestones should persist");

  memory.upsertL4Identity({
    values: ["long-term", "anti-bullshit"],
    mission: "sustainable growth",
  });
  const l4 = memory.readL4Identity();
  assert.ok(Array.isArray(l4.values), "l4 identity values should persist");
  assert.strictEqual(l4.mission, "sustainable growth");

  memory.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("memory L3/L4 tests: PASS");
}

run();
