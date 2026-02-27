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

async function run() {
  runMindRuntimeChecks();
  await runKernelMindHookCheck();
  console.log("mind tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
