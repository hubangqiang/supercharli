const assert = require("assert");
const { applyPersonaGuard, enforceHardEnding } = require("../src/core/policies");

function run() {
  const ok = applyPersonaGuard("我们先拆解问题，再推进一步。", "normal");
  assert.strictEqual(ok.ok, true);

  const certainty = applyPersonaGuard("这件事100%会成功。", "normal");
  assert.strictEqual(certainty.ok, false);

  const attack = applyPersonaGuard("你这个废物，赶紧滚蛋。", "s2");
  assert.strictEqual(attack.ok, false);
  assert.strictEqual(attack.reason, "personal-attack language blocked");

  const hardEnded = enforceHardEnding("你是想继续拖延还是现在开始？", "s2");
  assert.ok(!/[？?]\s*$/.test(hardEnded), "should remove question ending");
  assert.ok(/请立即执行第一步/.test(hardEnded), "should append jarvis-style action close");

  console.log("policies tests: PASS");
}

run();
