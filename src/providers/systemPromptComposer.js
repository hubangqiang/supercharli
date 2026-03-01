const { buildProfileSystemPrompt, buildProfileSystemPromptShort } = require("./profilePrompt");
const { buildResponseStylePrompt, buildResponseStylePromptShort } = require("./responseStylePrompt");
const { planPromptPacks } = require("./contextPlanner");
const { enforcePromptBudget } = require("./promptBudget");
const { materializeMemoryPack } = require("./contextMaterializer");

function composeSystemPrompt(context = {}, options = {}) {
  if (context && context.extractorMode) {
    return {
      text: [
        "Extractor mode:",
        "- Return strict JSON only.",
        "- Do not add markdown, explanations, or extra text.",
      ].join("\n"),
      meta: {
        usedTokens: 40,
        droppedPacks: 0,
        loadedPackIds: ["extractor-mode"],
      },
    };
  }

  const budget = Number(options.budget || 1800);
  const packIds = planPromptPacks(context);
  const registry = buildRegistry(context);
  const packs = packIds.map((id) => registry[id]).filter(Boolean);
  const applied = enforcePromptBudget(packs, budget);
  const text = applied.selected.map((p) => p.text).filter(Boolean).join("\n\n");
  return {
    text,
    meta: {
      usedTokens: applied.usedTokens,
      droppedPacks: applied.dropped,
      loadedPackIds: applied.selected.map((p) => p.id),
    },
  };
}

function buildRegistry(context) {
  return {
    "core-constraints": {
      id: "core-constraints",
      priority: 1,
      required: true,
      maxTokens: 140,
      text: [
        "Core constraints:",
        "- Maintain SuperCharli identity and safety boundaries.",
        "- External model does reasoning/generation; local memory/learning are augmentation and governance signals.",
        "- No fabricated certainty.",
        "- No internal labels in final answer.",
        "- Prefer decision/risk/action ending; allow one concise clarification question only when required.",
      ].join("\n"),
    },
    "persona-short": {
      id: "persona-short",
      priority: 2,
      required: true,
      maxTokens: 320,
      text: buildProfileSystemPromptShort(context.personaProfile),
    },
    "persona-full": {
      id: "persona-full",
      priority: 2,
      required: true,
      maxTokens: 760,
      text: buildProfileSystemPrompt(context.personaProfile),
    },
    "style-short": {
      id: "style-short",
      priority: 3,
      required: true,
      maxTokens: 220,
      text: buildResponseStylePromptShort(context),
    },
    "style-full": {
      id: "style-full",
      priority: 3,
      required: true,
      maxTokens: 680,
      text: buildResponseStylePrompt(context),
    },
    "memory-pack": {
      id: "memory-pack",
      priority: 4,
      required: false,
      maxTokens: 420,
      text: materializeMemoryPack(context),
    },
    "risk-pack": {
      id: "risk-pack",
      priority: 5,
      required: false,
      maxTokens: 120,
      text: [
        "Risk pack:",
        `- Current severity: ${context.severity || "normal"}.`,
        "- Prefer low-risk, reversible, verifiable actions.",
      ].join("\n"),
    },
  };
}

module.exports = { composeSystemPrompt };
