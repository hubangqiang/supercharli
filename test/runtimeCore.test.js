const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { Kernel } = require("../src/core/kernel");
const { SeverityStateMachine } = require("../src/core/severityStateMachine");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");
const { Telemetry } = require("../src/observability/telemetry");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

async function runCoreFlowChecks() {
  const telemetry = new Telemetry();
  const kernel = new Kernel(new InMemoryMemoryEngine(), new BasicModelRouter(), undefined, telemetry);

  const deep = await kernel.runTurn({ sessionId: "t1", text: "请做多步权衡分析" });
  assert.strictEqual(deep.meta.route, "deep", "deep route should be selected");
  assert.strictEqual(deep.meta.routeReason, "complex-planning-signal");
  assert.strictEqual(deep.meta.augmentationMode, "simulation-local");
  assert.strictEqual(deep.meta.usingExternalModel, false);
  assert.strictEqual(deep.meta.boundaryNote, "local-memory-learning-augment-only");

  const fallback = await kernel.runTurn({ sessionId: "t2", text: "force-error" });
  assert.strictEqual(fallback.meta.fallbackUsed, true, "fallback should be used");
  assert.strictEqual(fallback.meta.fallbackLevel, 2, "secondary model fallback should be used");
  assert.strictEqual(fallback.meta.model, "safe-secondary", "secondary model should serve response");

  const minimalSafe = await kernel.runTurn({ sessionId: "t2", text: "force-all-fail" });
  assert.strictEqual(minimalSafe.meta.fallbackLevel, 3, "minimal safe mode should activate");
  assert.strictEqual(minimalSafe.meta.responseMode, "minimal-safe");
  assert.strictEqual(minimalSafe.response.uncertainty, "模型链路暂时不可用，以下建议为保守降级方案。");

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

  assert.ok(telemetry.getEvents((e) => e.stage === "done").length >= 1, "telemetry should capture lifecycle");
  assert.ok(telemetry.getCount("turn_count") >= 1, "telemetry counters should update");
}

function runSeverityStateChecks() {
  let now = 0;
  const machine = new SeverityStateMachine({
    ttlMs: { s1: 10, s2: 20, s3: 30 },
    clock: () => now,
  });

  const sessionId = "severity-1";

  const s3 = machine.resolve({ sessionId, text: "high-risk", riskSignals: ["guardrail-risk"] });
  assert.strictEqual(s3, "s3", "should escalate to s3");

  now += 29;
  const holdS3 = machine.resolve({ sessionId, text: "普通对话" });
  assert.strictEqual(holdS3, "s3", "should keep s3 before ttl expiry");

  now += 1;
  const downToS2 = machine.resolve({ sessionId, text: "普通对话" });
  assert.strictEqual(downToS2, "s2", "should step down to s2 after s3 ttl");

  now += 20;
  const downToS1 = machine.resolve({ sessionId, text: "普通对话" });
  assert.strictEqual(downToS1, "s1", "should step down to s1 after s2 ttl");

  now += 10;
  const downToNormal = machine.resolveDetailed({ sessionId, text: "普通对话" });
  assert.strictEqual(downToNormal.severity, "normal", "should return to normal after s1 ttl");
  assert.ok(downToNormal.reason.includes("ttl-deescalate"), "de-escalation reason should be explicit");

  const s2Again = machine.resolve({ sessionId, text: "连续失败", riskSignals: ["repeated-failure"] });
  assert.strictEqual(s2Again, "s2", "should re-escalate when new signal appears");
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
  runSeverityStateChecks();
  await runSQLitePersistenceChecks();
  console.log("runtime core tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
