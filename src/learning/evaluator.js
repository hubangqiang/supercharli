const { classifyPatternKey } = require("../memory/patternClassifier");

class LearningEvaluator {
  evaluateTurn(turn = {}) {
    const text = String(turn.text || "");
    const lower = text.toLowerCase();
    const modelSignals = normalizeModelSignals(turn.modelSignals);
    const outcome = modelSignals?.outcome || detectOutcome(lower);
    const patternKey = modelSignals?.patternKey || classifyPatternKey(text);
    const shouldLearn =
      Boolean(modelSignals?.shouldLearn) ||
      outcome !== "neutral" ||
      patternKey !== "general-execution-pattern" ||
      turn.severity === "s3" ||
      Boolean(turn.focusMode);

    return {
      ts: new Date().toISOString(),
      text,
      severity: turn.severity || "normal",
      route: turn.route || "fast",
      patternKey,
      outcome,
      shouldLearn,
      summary: modelSignals?.summary || "",
      strategy: modelSignals?.strategy || "",
      signalSource: modelSignals ? "model-extracted" : "rule-based",
      signalConfidence: Number(modelSignals?.confidence || 0),
      fallbackUsed: Boolean(turn.fallbackUsed),
    };
  }
}

function detectOutcome(lower) {
  if (/(完成|做完|已做|done|finished|shipped|launched)/i.test(lower)) return "success";
  if (/(没做|失败|拖延|崩了|failed|stuck|procrast)/i.test(lower)) return "failure";
  return "neutral";
}

function normalizeModelSignals(input) {
  if (!input || typeof input !== "object") return null;
  const patternKey = sanitizePatternKey(input.patternKey);
  if (!patternKey) return null;
  return {
    patternKey,
    outcome: normalizeOutcome(input.outcome),
    shouldLearn: Boolean(input.shouldLearn),
    summary: String(input.summary || "").trim(),
    strategy: String(input.strategy || "").trim(),
    confidence: clamp01(Number(input.confidence || 0)),
  };
}

function sanitizePatternKey(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!s || s.length < 3) return "";
  return s.slice(0, 64);
}

function normalizeOutcome(v) {
  const s = String(v || "").toLowerCase();
  if (s === "success" || s === "failure" || s === "neutral") return s;
  return "neutral";
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

module.exports = { LearningEvaluator };
