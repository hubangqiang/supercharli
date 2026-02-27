function classifyPatternKey(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("焦虑") || lower.includes("anxious") || lower.includes("anxiety")) return "stress-planning";
  if (lower.includes("拖延") || lower.includes("procrast")) return "procrastination-loop";
  if (lower.includes("冲动") || lower.includes("impulsive")) return "high-risk-impulse";
  if (lower.includes("决策") || lower.includes("犹豫") || lower.includes("纠结") || lower.includes("decision")) {
    return "decision-conflict-loop";
  }
  return "general-execution-pattern";
}

function defaultStrategyForPattern(key) {
  const map = {
    "stress-planning": "Convert anxiety into one controllable objective and one immediate action.",
    "procrastination-loop": "Set a hard 30-minute action deadline and produce one visible output.",
    "high-risk-impulse": "Delay irreversible decisions and run a bounded low-risk trial first.",
    "decision-conflict-loop": "Define decision criteria first, then run a reversible A/B trial.",
    "general-execution-pattern": "Break into one objective and one minimal next step.",
  };
  return map[key] || map["general-execution-pattern"];
}

module.exports = { classifyPatternKey, defaultStrategyForPattern };
