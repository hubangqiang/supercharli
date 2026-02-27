const { classifyPatternKey } = require("../memory/patternClassifier");

class LearningEvaluator {
  evaluateTurn(turn = {}) {
    const text = String(turn.text || "");
    const lower = text.toLowerCase();
    const outcome = detectOutcome(lower);
    const patternKey = classifyPatternKey(text);
    const shouldLearn = outcome !== "neutral" || patternKey !== "general-execution-pattern" || turn.severity === "s3";

    return {
      ts: new Date().toISOString(),
      text,
      severity: turn.severity || "normal",
      route: turn.route || "fast",
      patternKey,
      outcome,
      shouldLearn,
      fallbackUsed: Boolean(turn.fallbackUsed),
    };
  }
}

function detectOutcome(lower) {
  if (/(完成|做完|已做|done|finished|shipped|launched)/i.test(lower)) return "success";
  if (/(没做|失败|拖延|崩了|failed|stuck|procrast)/i.test(lower)) return "failure";
  return "neutral";
}

module.exports = { LearningEvaluator };
