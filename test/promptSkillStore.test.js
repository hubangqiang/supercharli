const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { SQLiteMemoryEngine } = require("../src/memory/sqliteMemoryEngine");

function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-prompt-skill-"));
  const dbPath = path.join(root, "memory.db");
  const engine = new SQLiteMemoryEngine({ dbPath });

  engine.recordPromptSkills({
    createdAt: "2026-03-01T00:00:00.000Z",
    sessionId: "main",
    traceId: "trace-1",
    route: "fast",
    modelProvider: "anthropicrelay",
    modelName: "claude-sonnet-4",
    promptTokensUsed: 820,
    droppedPacks: 1,
    skills: [
      { id: "core-constraints", tokens: 120, text: "Core constraints text." },
      { id: "persona-short", tokens: 260, text: "Persona short text." },
    ],
  });

  engine.recordPromptSkills({
    createdAt: "2026-03-01T00:01:00.000Z",
    sessionId: "main",
    traceId: "trace-2",
    route: "deep",
    modelProvider: "anthropicrelay",
    modelName: "claude-sonnet-4",
    promptTokensUsed: 1010,
    droppedPacks: 0,
    skills: [{ id: "core-constraints", tokens: 120, text: "Core constraints text v2." }],
  });

  const catalog = engine.listPromptSkillCatalog(10);
  assert.ok(catalog.length >= 2, "catalog should keep unique skills");
  const core = catalog.find((x) => x.skillId === "core-constraints");
  assert.ok(core, "core-constraints should exist");
  assert.strictEqual(core.seenCount, 2, "seen count should accumulate");

  const history = engine.listPromptSkillHistory(10);
  assert.strictEqual(history.length, 2, "history should keep events");
  assert.strictEqual(history[0].traceId, "trace-2", "latest history should come first");
  assert.ok(Array.isArray(history[0].loadedSkills), "history row should contain loaded skills details");

  engine.upsertSkill({
    skillId: "testcase-3part",
    title: "测试用例三段式",
    applicability: "当用户要求测试用例设计时",
    method: "步骤+预期+实际",
    boundaries: "不写具体产品结论",
    confidence: 0.88,
  });
  const recalledSkills = engine.recallSkills("我想继续写测试用例", 3);
  assert.ok(recalledSkills.some((x) => x.skillId === "testcase-3part"), "should recall published skills by query");
  engine.recordSkillUsage({
    sessionId: "main",
    traceId: "trace-3",
    route: "deep",
    modelProvider: "anthropicrelay",
    modelName: "claude-sonnet-4",
    skillIds: ["testcase-3part"],
    pass: true,
    responseScore: 0.86,
  });
  const skillHistory = engine.listSkillHistory(10);
  assert.ok(skillHistory.length >= 1, "skill usage history should be persisted");
  const skills = engine.listSkills(10);
  const testcase = skills.find((x) => x.skillId === "testcase-3part");
  assert.ok(testcase, "stored skill should exist");
  assert.ok(Number(testcase.useCount || 0) >= 1, "skill use count should increase");
  assert.ok(Number(testcase.qualityScore || 0) > 0.5, "quality score should be updated from usage outcome");

  engine.close();
  fs.rmSync(root, { recursive: true, force: true });
  console.log("prompt skill store tests: PASS");
}

run();
