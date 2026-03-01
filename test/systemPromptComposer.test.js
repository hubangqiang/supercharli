const assert = require("assert");
const { composeSystemPrompt } = require("../src/providers/systemPromptComposer");

function run() {
  const out = composeSystemPrompt(
    {
      text: "我最近拖延，想马上动手",
      severity: "s2",
      complexity: "deep",
      l1: [{ text: "昨天也拖延", severity: "s2" }],
      recalled: [{ key: "procrastination-loop", summary: "Repeated pattern detected: procrastination-loop", strategy: "start in 30 minutes" }],
      learningStage: "pattern",
      learningPolicy: { directness: 0.92, actionPressure: 0.93, reflectionDepth: 0.5, explorationBias: 0.4 },
      personaProfile: { charliName: "Johnny", roleDefinition: "强推动伙伴", personalityCore: ["反空话", "高行动倾向"] },
    },
    { budget: 1200 },
  );

  assert.ok(out.text.includes("Core constraints"), "must include core constraints");
  assert.ok(out.text.includes("augmentation and governance signals"), "must include augmentation boundary");
  assert.ok(out.meta.usedTokens <= 1200, "must respect prompt budget");
  assert.ok(out.meta.loadedPackIds.length >= 3, "must load multiple packs");
  assert.ok(out.meta.loadedPackIds.some((id) => id.startsWith("style-")), "must load style pack");

  const tiny = composeSystemPrompt({ text: "hi" }, { budget: 200 });
  assert.ok(tiny.meta.usedTokens <= 200, "must clip in tiny budget");
  assert.ok(tiny.text.includes("Identity invariants"), "must still keep required persona constraints");

  console.log("system prompt composer tests: PASS");
}

run();
