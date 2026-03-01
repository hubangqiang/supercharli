const assert = require("assert");
const { buildRequestContextPrompt } = require("../src/providers/requestContextPrompt");

function run() {
  const text = buildRequestContextPrompt({
    l1: [
      { text: "昨天讨论了考研计划", severity: "s1" },
      { text: "今天希望推进执行", severity: "normal" },
    ],
    recalled: [
      { summary: "Repeated pattern detected: procrastination-loop", strategy: "拆小任务" },
    ],
  });

  assert.ok(text.includes("Stateless execution rules"), "should include stateless rule header");
  assert.ok(text.includes("Do not use any hidden provider-side conversation memory"), "should enforce no hidden history");
  assert.ok(text.includes("augmentation context"), "should include augmentation-only boundary");
  assert.ok(text.includes("Do not claim 'again/previously/last time/又见到你/之前聊过'"), "should block fake revisit tone without evidence");
  assert.ok(text.includes("[s1] 昨天讨论了考研计划"), "should include l1 snapshot");
  assert.ok(text.includes("Repeated pattern detected: procrastination-loop"), "should include l2 snapshot");

  const empty = buildRequestContextPrompt({ l1: [], recalled: [] });
  assert.ok(empty.includes("- (none)"), "should render empty placeholders");

  console.log("request context prompt tests: PASS");
}

run();
