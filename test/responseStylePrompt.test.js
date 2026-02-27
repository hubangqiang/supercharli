const assert = require("assert");
const {
  buildResponseStylePrompt,
  detectMode,
  countRepeatedMode,
  resolveToneLevel,
} = require("../src/providers/responseStylePrompt");

function run() {
  const anxiety = detectMode("我最近事业焦虑，晚上有点睡不着");
  assert.strictEqual(anxiety.id, "anxiety_overload");

  const procrastination = detectMode("我总是拖延，明天再开始");
  assert.strictEqual(procrastination.id, "procrastination_avoidance");

  const repeat = countRepeatedMode(
    [{ text: "我在拖延" }, { text: "还是拖延" }, { text: "我又开始拖延了" }],
    "procrastination_avoidance",
  );
  assert.strictEqual(repeat, 3);
  assert.strictEqual(resolveToneLevel("procrastination_avoidance", repeat), "S3");
  assert.strictEqual(resolveToneLevel("normal_coaching", 0), "S2");
  assert.strictEqual(resolveToneLevel("anxiety_overload", 0), "S1");
  assert.strictEqual(resolveToneLevel("procrastination_avoidance", 2), "S2");
  assert.strictEqual(resolveToneLevel("decision_conflict", 0, { actionPressure: 0.92, directness: 0.91 }), "S2");

  const prompt = buildResponseStylePrompt({
    text: "我现在很焦虑，怕事业失控",
    l1: [{ text: "之前也在焦虑" }],
  });

  assert.ok(prompt.includes("Humanized response rules"), "should include humanized rules");
  assert.ok(prompt.includes("Style target (JARVIS-inspired, not imitation)"), "should include jarvis-inspired style target");
  assert.ok(prompt.includes("no profanity"), "should prohibit profanity");
  assert.ok(prompt.includes("never attack the person"), "should keep behavior-vs-person boundary");
  assert.ok(prompt.includes("Question usage rule"), "should allow limited clarification question");
  assert.ok(prompt.includes("Avoid pushy phrasing"), "should avoid pushy phrasing");
  assert.ok(prompt.includes("Detected user state: anxiety_overload"), "should detect anxiety state");
  assert.ok(prompt.includes("Tone intensity: S1"), "should use calmer tone for anxiety");
  assert.ok(prompt.includes("Learning stage: apprentice"), "should include learning stage");
  assert.ok(prompt.includes("policy bias"), "should include policy bias");
  assert.ok(prompt.includes("Use structure now: anxiety_overload"), "should route structure");
  assert.ok(prompt.includes("Do not output internal labels"), "should suppress model/next labels");

  console.log("response style prompt tests: PASS");
}

run();
