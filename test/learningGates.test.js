const assert = require("assert");
const { evaluateLearningGates } = require("../src/learning/gates");

function run() {
  const fail = evaluateLearningGates(
    { total: 10, successRate: 0.5, failureRate: 0.2, recurrenceRate: 0.6 },
    { minSamples: 30 },
  );
  assert.strictEqual(fail.pass, false);
  assert.strictEqual(fail.gates.g0_data_sufficiency, false);

  const pass = evaluateLearningGates(
    { total: 40, successRate: 0.6, failureRate: 0.2, recurrenceRate: 0.5 },
    { minSamples: 30, minAcr: 0.5, maxFailureRate: 0.4, maxRecurrenceRate: 0.8 },
  );
  assert.strictEqual(pass.pass, true);

  console.log("learning gates tests: PASS");
}

run();
