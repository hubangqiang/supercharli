const assert = require("assert");
const { rankRecalledItems } = require("../src/memory/recallRanking");

function run() {
  const out = rankRecalledItems(
    [
      { key: "procrastination-loop", summary: "Repeated pattern detected: procrastination-loop", strength: 0.8, updatedAt: "2025-01-01T00:00:00.000Z" },
      { key: "stress-planning", summary: "Repeated pattern detected: stress-planning", strength: 1.2, updatedAt: "2025-01-02T00:00:00.000Z" },
    ],
    "最近总是 procrastination-loop",
    1,
  );

  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].key, "procrastination-loop");
  console.log("memory recall tests: PASS");
}

run();
