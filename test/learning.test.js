const assert = require("assert");
const { Learner } = require("../src/learning/learner");
const { Kernel } = require("../src/core/kernel");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

function runLearnerChecks() {
  const learner = new Learner();
  const samples = [
    "我还是拖延",
    "今天先做了第一步，done",
    "又拖延了",
    "完成了一个关键动作",
    "我很纠结这个决策",
    "我已经做完并提交",
  ];

  for (const text of samples) {
    learner.observeTurn({ text, severity: "s2", route: "fast", fallbackUsed: false });
  }

  const snap = learner.snapshot();
  assert.ok(["pattern", "transfer", "autonomous", "apprentice"].includes(snap.stage.stage));
  assert.ok(snap.eventCount >= samples.length);
  assert.ok(typeof snap.policy.directness === "number");

  const consolidated = learner.runConsolidation(3);
  assert.ok(Array.isArray(consolidated.candidates));
  assert.ok(consolidated.candidates.length <= 3);

  const withModelSignal = learner.observeTurn({
    text: "请记住：京东注册用例使用三段式",
    severity: "s2",
    route: "deep",
    fallbackUsed: false,
    activeLearning: true,
    modelSignals: {
      patternKey: "京东-测试-用例-三段式",
      outcome: "success",
      shouldLearn: true,
      summary: "京东测试用例采用三段式：步骤、预期、实际。",
      strategy: "每条用例必须同时填写步骤、预期和实际结果。",
      confidence: 0.9,
    },
  });
  assert.strictEqual(withModelSignal.event.signalSource, "model-extracted");
  assert.ok(withModelSignal.event.patternKey.includes("京东"), "should keep unicode pattern key");
}

async function runKernelHookCheck() {
  const learner = new Learner();
  const kernel = new Kernel(new InMemoryMemoryEngine(), new BasicModelRouter(), undefined, undefined, learner);
  const out = await kernel.runTurn({ sessionId: "learning-1", text: "我又拖延了" });
  assert.ok(out.meta.learningStage, "kernel should expose learning stage");
  assert.ok(out.meta.policySnapshot, "kernel should expose policy snapshot");

  const active = await kernel.runTurn({ sessionId: "learning-1", text: "请你主动学习并复盘我最近的模式" });
  assert.strictEqual(active.meta.activeLearningRequested, true);

  const focused = await kernel.runTurn({ sessionId: "learning-1", text: "这是具体工作：支付项目上线测试清单" });
  assert.strictEqual(focused.meta.focusMode, true);
  assert.strictEqual(focused.meta.route, "deep");
  assert.strictEqual(focused.meta.activeLearningRequested, false);
}

async function run() {
  runLearnerChecks();
  await runKernelHookCheck();
  console.log("learning tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
