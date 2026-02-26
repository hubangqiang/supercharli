const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { Kernel } = require("../src/core/kernel");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

async function runCoreFlowChecks() {
  const kernel = new Kernel(new InMemoryMemoryEngine(), new BasicModelRouter());

  const deep = await kernel.runTurn({ sessionId: "t1", text: "请做多步权衡分析" });
  assert.strictEqual(deep.meta.route, "deep", "deep route should be selected");

  const fallback = await kernel.runTurn({ sessionId: "t2", text: "force-error" });
  assert.strictEqual(fallback.meta.fallbackUsed, true, "fallback should be used");
  assert.strictEqual(fallback.meta.model, "safe-fallback", "fallback model should serve response");

  const severe = await kernel.runTurn({ sessionId: "t3", text: "high-risk", riskSignals: ["guardrail-risk"] });
  assert.strictEqual(severe.meta.severity, "s3", "s3 should be triggered");

  const guard = await kernel.runTurn({ sessionId: "t4", text: "force-certainty" });
  assert.strictEqual(guard.meta.regenerated, true, "guard violation should trigger regeneration");
  assert.ok(!/100%/i.test(guard.response.conclusion), "final response should not keep certainty claim");

  const p1 = await kernel.runTurn({ sessionId: "t5", text: "我又拖延了" });
  const p2 = await kernel.runTurn({ sessionId: "t5", text: "还是拖延" });
  const p3 = await kernel.runTurn({ sessionId: "t5", text: "拖延循环" });
  assert.strictEqual(p1.meta.promotedToL2, false);
  assert.strictEqual(p2.meta.promotedToL2, false);
  assert.strictEqual(p3.meta.promotedToL2, true, "third repeat should promote to L2");
}

async function runSQLitePersistenceChecks() {
  const tmpDir = fs.mkdtempSync(path.join(process.cwd(), "tmp-runtime-core-"));
  const dbPath = path.join(tmpDir, "memory.db");

  const router = new BasicModelRouter();
  const memoryA = new SQLiteMemoryEngine({ dbPath, threshold: 3 });
  const kernelA = new Kernel(memoryA, router);

  await kernelA.runTurn({ sessionId: "persist-1", text: "第一次拖延" });
  await kernelA.runTurn({ sessionId: "persist-1", text: "第二次拖延" });
  const third = await kernelA.runTurn({ sessionId: "persist-1", text: "第三次拖延" });
  assert.strictEqual(third.meta.promotedToL2, true, "L2 promotion should persist after threshold");
  memoryA.close();

  const memoryB = new SQLiteMemoryEngine({ dbPath, threshold: 3 });
  const l1 = memoryB.readL1("persist-1");
  assert.strictEqual(l1.length, 3, "L1 history should survive restart");

  const recalled = memoryB.recallL2("最近总在 procrastination-loop");
  assert.ok(recalled.length >= 1, "L2 recall should survive restart");
  memoryB.close();

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function run() {
  await runCoreFlowChecks();
  await runSQLitePersistenceChecks();
  console.log("runtime core tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
