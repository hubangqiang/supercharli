function buildResponseStylePrompt(context = {}) {
  const text = String(context.text || "");
  const lower = text.toLowerCase();
  const detected = detectMode(lower);
  const repeatCount = countRepeatedMode(context.l1, detected.id);
  const toneLevel = resolveToneLevel(detected.id, repeatCount, context.learningPolicy);
  const learningStage = context.learningStage || "apprentice";
  const policy = normalizePolicy(context.learningPolicy);
  const styleBias = describePolicyBias(policy);

  const lines = [
    "Humanized response rules:",
    `- Learning stage: ${learningStage}; policy bias: ${styleBias}; tone: ${toneLevel}.`,
    "- Blend empathy and reasoning with a calm, professional JARVIS-like tone.",
    "- Start from the user's concrete pressure point, then move to diagnosis, options, and action.",
    "- Avoid slogan-heavy output and avoid repetitive fixed openings.",
    "- Use short philosophical anchors only when they help action.",
    "- At most one concrete action task in a single reply.",
    "- Keep final answer to 4-8 sentences unless user asks for more.",
    "- Do not output internal labels such as route, mode, model, next step tags.",
    "- Style target (JARVIS-inspired, not imitation): composed clarity, precise wording, anticipatory risk awareness.",
    "- Language texture: concise and polished, with measured confidence and zero theatrics.",
    "- Default stance is calm-professional (S1/S2), never aggressive.",
    "- Flavor option: occasional concise service-style line (for example: 'Understood.').",
    "- Profanity policy: no profanity and no insults.",
    "- Hard boundary: challenge assumptions and choices, never attack the person.",
    "- Never mirror user's abusive words, insults, or profanity.",
    "- Ending discipline: close with a decision line, risk line, or one clear action line.",
    "",
    "Reply structure library:",
    "- anxiety_overload: acknowledge pressure briefly -> cut noise -> immediate stop-loss action.",
    "- procrastination_avoidance: identify blocker -> minimum viable action -> short checkpoint.",
    "- decision_conflict: decision criteria -> binary choice -> reversible trial window.",
    "- setback_self_blame: separate facts vs judgment -> restore control -> one corrective action.",
    "- oversized_goal: split into milestone -> lock current stage -> explicit acceptance criteria.",
    "- long_horizon_growth: trend perspective -> pattern extraction -> habit solidification.",
    "- deep_reflection: one philosophical anchor -> practical variables -> direct judgment.",
    "- normal_coaching: concise diagnosis -> one concrete move -> clear checkpoint.",
    "",
    `Detected user state: ${detected.id}.`,
    `Tone intensity: ${toneLevel} (repeatCount=${repeatCount}).`,
    `Use structure now: ${detected.structure}.`,
    `Style intent: ${detected.intent}.`,
    "Deboilerplate rule: do not use the same opening style in consecutive turns for the same session.",
    "Do not start every reply with generic comfort phrases; start with a concise judgment.",
    "When same problem repeats, escalate precision and tighten checkpoint clarity.",
    "If user is emotional or offensive, stay composed and redirect to concrete problem-solving.",
    "Question usage rule: allow one concise clarification question only when critical information is missing.",
    "Avoid pushy phrasing such as: '别绕了', '马上给我做', '别废话'.",
  ];

  if (context.focusMode) {
    lines.push(
      "",
      "Focus mode (work execution):",
      "- Prioritize delivery quality, risk control, and completion criteria.",
      "- Provide a structured mini-plan: objective, key checks, and immediate next action.",
      "- Keep language concise and task-oriented.",
    );
  }

  return lines.join("\n");
}

function detectMode(lowerText) {
  const modes = [
    {
      id: "anxiety_overload",
      structure: "anxiety_overload",
      intent: "stabilize emotion first, then convert panic into one controllable action",
      re: /(焦虑|崩|压垮|睡不着|慌|恐慌|anxiety|panic|overwhelm|burnout)/i,
    },
    {
      id: "procrastination_avoidance",
      structure: "procrastination_avoidance",
      intent: "break avoidance loop and force tiny execution momentum",
      re: /(拖延|等下|再说|明天再|没准备好|procrastinat|delay|later|avoid)/i,
    },
    {
      id: "decision_conflict",
      structure: "decision_conflict",
      intent: "remove indecision by criteria-first and reversible choice",
      re: /(选|选择|决策|犹豫|纠结|a还是b|choose|decision|which one)/i,
    },
    {
      id: "setback_self_blame",
      structure: "setback_self_blame",
      intent: "protect dignity while rebuilding agency from facts",
      re: /(我不行|我太差|失败|自责|丢脸|useless|i am not good|self-blame|ashamed)/i,
    },
    {
      id: "oversized_goal",
      structure: "oversized_goal",
      intent: "reduce abstraction and force milestone execution",
      re: /(太大|无从下手|不知道从哪|目标太大|huge goal|too big|where to start)/i,
    },
    {
      id: "long_horizon_growth",
      structure: "long_horizon_growth",
      intent: "extract compounding strategy for long-term growth",
      re: /(长期|复利|习惯|成长路线|long term|compound|habit|roadmap)/i,
    },
    {
      id: "deep_reflection",
      structure: "deep_reflection",
      intent: "balance philosophy and practical reasoning",
      re: /(为什么活着|意义|价值观|哲学|meaning|purpose|philosophy|value)/i,
    },
  ];

  for (const mode of modes) {
    if (mode.re.test(lowerText)) return mode;
  }

  return {
    id: "normal_coaching",
    structure: "normal_coaching",
    intent: "clear diagnosis with one practical move",
  };
}

function countRepeatedMode(l1, modeId) {
  const items = Array.isArray(l1) ? l1.slice(-6) : [];
  if (!modeId || !items.length) return 0;

  let count = 0;
  for (const item of items) {
    const text = String(item?.text || "").toLowerCase();
    const mode = detectMode(text);
    if (mode.id === modeId) count += 1;
  }
  return count;
}

function resolveToneLevel(modeId, repeatCount, policy) {
  const fastEscalateModes = new Set(["procrastination_avoidance", "decision_conflict", "oversized_goal"]);
  if (fastEscalateModes.has(modeId) && repeatCount >= 3) return "S3";
  if (repeatCount >= 4) return "S3";
  const p = normalizePolicy(policy);
  if (p.actionPressure >= 0.88 || p.directness >= 0.9) {
    if (fastEscalateModes.has(modeId) && repeatCount >= 2) return "S3";
    return "S2";
  }
  return modeId === "anxiety_overload" ? "S1" : "S2";
}

function normalizePolicy(policy) {
  const p = policy && typeof policy === "object" ? policy : {};
  return {
    directness: Number.isFinite(p.directness) ? p.directness : 0.7,
    actionPressure: Number.isFinite(p.actionPressure) ? p.actionPressure : 0.75,
    reflectionDepth: Number.isFinite(p.reflectionDepth) ? p.reflectionDepth : 0.45,
    explorationBias: Number.isFinite(p.explorationBias) ? p.explorationBias : 0.5,
  };
}

function describePolicyBias(policy) {
  const tags = [];
  if (policy.directness >= 0.85) tags.push("high-directness");
  if (policy.actionPressure >= 0.85) tags.push("high-action-pressure");
  if (policy.reflectionDepth >= 0.7) tags.push("high-reflection");
  if (policy.explorationBias >= 0.65) tags.push("high-exploration");
  if (!tags.length) tags.push("balanced-default");
  return tags.join(", ");
}

module.exports = {
  buildResponseStylePrompt,
  buildResponseStylePromptShort,
  detectMode,
  countRepeatedMode,
  resolveToneLevel,
  normalizePolicy,
  describePolicyBias,
};

function buildResponseStylePromptShort(context = {}) {
  const detected = detectMode(String(context.text || "").toLowerCase());
  const repeatCount = countRepeatedMode(context.l1, detected.id);
  const tone = resolveToneLevel(detected.id, repeatCount, context.learningPolicy);
  const stage = context.learningStage || "apprentice";
  const bias = describePolicyBias(normalizePolicy(context.learningPolicy));

  return [
    "Style runtime:",
    `- Mode: ${detected.id}; tone: ${tone}; stage: ${stage}; bias: ${bias}.`,
    context.focusMode ? "- Focus mode: ON (work execution priority)." : "- Focus mode: OFF.",
    "- Use concise professional sentences, one action max, and allow one clarification question only when needed.",
    "- Keep respect boundaries: no insults, no profanity.",
  ].join("\n");
}
