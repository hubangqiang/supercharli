const assert = require("assert");
const { Kernel } = require("../src/core/kernel");
const { InMemoryMemoryEngine } = require("../src/memory/inMemoryMemoryEngine");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

async function run() {
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

  console.log("runtime core tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
