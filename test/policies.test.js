const assert = require("assert");
const { applyPersonaGuard } = require("../src/core/policies");

function run() {
  const ok = applyPersonaGuard("我们先拆解问题，再推进一步。", "normal");
  assert.strictEqual(ok.ok, true);

  const certainty = applyPersonaGuard("这件事100%会成功。", "normal");
  assert.strictEqual(certainty.ok, false);

  const attack = applyPersonaGuard("你这个废物，赶紧滚蛋。", "s2");
  assert.strictEqual(attack.ok, false);
  assert.strictEqual(attack.reason, "personal-attack language blocked");

  console.log("policies tests: PASS");
}

run();
