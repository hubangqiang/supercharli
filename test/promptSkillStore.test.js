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

  engine.close();
  fs.rmSync(root, { recursive: true, force: true });
  console.log("prompt skill store tests: PASS");
}

run();
