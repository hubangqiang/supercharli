const assert = require("assert");
const { computePromotionScore } = require("../src/memory/promotionScoring");

function run() {
  const weak = computePromotionScore(
    { text: "我有点想法", severity: "normal" },
    { repeatCount: 1, threshold: 3, scoreThreshold: 0.65 },
  );
  assert.strictEqual(weak.shouldPromote, false);

  const strong = computePromotionScore(
    { text: "我还是拖延，今天必须执行并完成最小动作", severity: "s2" },
    { repeatCount: 3, threshold: 3, scoreThreshold: 0.65 },
  );
  assert.strictEqual(strong.shouldPromote, true);
  assert.ok(strong.score >= 0.65);

  console.log("memory scoring tests: PASS");
}

run();
