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
        loadedPacks: [{ id: "extractor-mode", tokens: 40, text: "Extractor mode: strict JSON only." }],
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
      loadedPacks: applied.selected.map((p) => ({
        id: p.id,
        tokens: p.tokens,
        text: p.text,
        required: Boolean(p.required),
        priority: Number(p.priority || 100),
      })),
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
        "- Do not mention skill lifecycle, meta-router, prompt packs, or governance internals to user.",
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
    "dynamic-skills-pack": {
      id: "dynamic-skills-pack",
      priority: 4,
      required: false,
      maxTokens: 420,
      text: materializeSkillPack(context.skills),
    },
    "quality-repair-pack": {
      id: "quality-repair-pack",
      priority: 4,
      required: false,
      maxTokens: 180,
      text: materializeQualityRepairPack(context.qualityFeedback),
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

function materializeSkillPack(skills) {
  const rows = Array.isArray(skills) ? skills.filter(Boolean).slice(0, 3) : [];
  if (!rows.length) return "";
  const lines = ["Dynamic skill pack (method assets, not fixed answers):"];
  for (const skill of rows) {
    const id = String(skill.skillId || skill.id || "").trim();
    if (!id) continue;
    const title = String(skill.title || "").trim();
    const applicability = String(skill.applicability || "").replace(/\s+/g, " ").trim();
    const method = String(skill.method || "").replace(/\s+/g, " ").trim();
    const boundaries = String(skill.boundaries || "").replace(/\s+/g, " ").trim();
    lines.push(`- [${id}] ${title || "untitled"}`);
    if (applicability) lines.push(`  apply-when: ${applicability}`);
    if (method) lines.push(`  method: ${method}`);
    if (boundaries) lines.push(`  boundary: ${boundaries}`);
  }
  lines.push("- Use only relevant parts of these skills; do not copy as rigid template.");
  return lines.join("\n");
}

function materializeQualityRepairPack(feedback) {
  const text = String(feedback || "").trim();
  if (!text) return "";
  return ["Quality repair pack:", text].join("\n");
}

module.exports = { composeSystemPrompt };
