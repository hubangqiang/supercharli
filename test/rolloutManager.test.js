const assert = require("assert");
const { decideRollout } = require("../src/learning/rolloutManager");

function run() {
  const hold = decideRollout({
    gate: { pass: false },
    current: { enabled: false, ratio: 0, version: null },
    metrics: { failureRate: 0.2 },
  });
  assert.strictEqual(hold.action, "hold");

  const activate = decideRollout({
    gate: { pass: true },
    current: { enabled: false, ratio: 0, version: 1 },
    metrics: { failureRate: 0.2 },
  });
  assert.strictEqual(activate.action, "activate");
  assert.strictEqual(activate.rollout.ratio, 0.1);

  const rollback = decideRollout({
    gate: { pass: true },
    current: { enabled: true, ratio: 0.4, version: 2 },
    metrics: { failureRate: 0.7 },
  });
  assert.strictEqual(rollback.action, "rollback");
  assert.strictEqual(rollback.rollout.enabled, false);

  console.log("rollout manager tests: PASS");
}

run();
