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
}

async function runKernelHookCheck() {
  const learner = new Learner();
  const kernel = new Kernel(new InMemoryMemoryEngine(), new BasicModelRouter(), undefined, undefined, learner);
  const out = await kernel.runTurn({ sessionId: "learning-1", text: "我又拖延了" });
  assert.ok(out.meta.learningStage, "kernel should expose learning stage");
  assert.ok(out.meta.policySnapshot, "kernel should expose policy snapshot");
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
