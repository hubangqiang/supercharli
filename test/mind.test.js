const assert = require("assert");
const { MindRuntime } = require("../src/mind");
const { Kernel } = require("../src/core/kernel");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

function runMindRuntimeChecks() {
  const mind = new MindRuntime();
  const out = mind.prepareTurn({
    text: "我不确定，最近高风险又拖延",
    severity: "s3",
    riskSignals: ["guardrail-risk"],
    l1: [{ text: "昨天也拖延" }],
    recalled: [{ summary: "Repeated pattern detected: procrastination-loop" }],
  });

  assert.strictEqual(out.thinking.mode, "deliberate");
  assert.ok(out.metacognition.confidence < 0.7);
  assert.ok(Array.isArray(out.workspace.blocks));
  assert.ok(out.workspace.blocks.length <= 5);
}

async function runKernelMindHookCheck() {
  const kernel = new Kernel(
    new InMemoryMemoryEngine(),
    new BasicModelRouter(),
    undefined,
    undefined,
    null,
    new MindRuntime(),
  );

  const out = await kernel.runTurn({
    sessionId: "mind-1",
    text: "我不确定这个决策",
    riskSignals: ["guardrail-risk"],
  });

  assert.ok(out.meta.metacognitiveConfidence <= 0.95);
  assert.ok(["fast", "deliberate"].includes(out.meta.thinkingMode));
  assert.ok(out.meta.selfAuditStatus, "should include self audit status");
}

function runMindFinalizeGateCheck() {
  const mind = new MindRuntime();
  mind.finalizeTurn({
    stage: { stage: "pattern" },
    gate: { pass: true },
    policyVersion: 1,
    policy: { policy: { directness: 0.8, actionPressure: 0.8, reflectionDepth: 0.4 } },
  });
  mind.finalizeTurn({
    stage: { stage: "transfer" },
    gate: { pass: false },
    policyVersion: 1,
    policy: { policy: { directness: 0.81, actionPressure: 0.79, reflectionDepth: 0.45 } },
  });
  const model = mind.snapshot();
  assert.strictEqual(model.stage, "transfer");
  assert.strictEqual(model.gatePassCount, 1);
  assert.strictEqual(model.gateFailCount, 1);
}

async function run() {
  runMindRuntimeChecks();
  runMindFinalizeGateCheck();
  await runKernelMindHookCheck();
  console.log("mind tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
