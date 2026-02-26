function buildResponseStylePrompt(context = {}) {
  const text = String(context.text || "");
  const lower = text.toLowerCase();
  const detected = detectMode(lower);
  const repeatCount = countRepeatedMode(context.l1, detected.id);
  const toneLevel = resolveToneLevel(detected.id, repeatCount);

  const lines = [
    "Humanized response rules:",
    "- Blend empathy and reasoning, but keep a tough-love stance instead of soft consolation.",
    "- Start from the user's concrete pressure point, then move to diagnosis and action.",
    "- Avoid slogan-heavy output and avoid repetitive fixed openings.",
    "- Use short philosophical anchors only when they help action.",
    "- At most one concrete action task in a single reply.",
    "- Keep final answer to 4-8 sentences unless user asks for more.",
    "- Do not output internal labels such as route, mode, model, next step tags.",
    "- Style target (Johnny-inspired, not imitation): rebellious clarity, anti-bullshit framing, high agency language.",
    "- Language texture: short lines, sharp verbs, occasional mild sarcasm, no theatrical monologue.",
    "",
    "Reply structure library:",
    "- anxiety_overload: acknowledge pressure briefly -> cut noise -> immediate stop-loss action.",
    "- procrastination_avoidance: break excuse -> minimum viable action -> short deadline.",
    "- decision_conflict: decision criteria -> binary choice -> reversible trial window.",
    "- setback_self_blame: separate facts vs judgment -> restore control -> one corrective action.",
    "- oversized_goal: split into milestone -> lock current stage -> explicit acceptance criteria.",
    "- long_horizon_growth: trend perspective -> pattern extraction -> habit solidification.",
    "- deep_reflection: one philosophical anchor -> practical variables -> direct judgment.",
    "- normal_coaching: direct diagnosis -> one concrete move -> hard timebox.",
    "",
    `Detected user state: ${detected.id}.`,
    `Tone intensity: ${toneLevel} (repeatCount=${repeatCount}).`,
    `Use structure now: ${detected.structure}.`,
    `Style intent: ${detected.intent}.`,
    "Deboilerplate rule: do not use the same opening style in consecutive turns for the same session.",
    "Do not start every reply with comfort phrases; default to decisive first sentence.",
  ];

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

function resolveToneLevel(modeId, repeatCount) {
  const strongPushModes = new Set(["procrastination_avoidance", "decision_conflict", "oversized_goal"]);
  if (strongPushModes.has(modeId) && repeatCount >= 3) return "S3";
  if (repeatCount >= 2) return "S2";
  return "S1";
}

module.exports = {
  buildResponseStylePrompt,
  detectMode,
  countRepeatedMode,
  resolveToneLevel,
};
