function evaluateResponseQuality(input = {}) {
  const text = String(input.responseText || "").trim();
  const focusMode = Boolean(input.focusMode);
  const issues = [];
  let score = 0.72;

  if (!text) {
    issues.push("empty-response");
    return { pass: false, score: 0, issues };
  }

  if (/(^|\n)\s*(next|model|route|learn)\s*:/i.test(text)) {
    score -= 0.45;
    issues.push("internal-label-leak");
  }

  if (text.length < 20) {
    score -= 0.18;
    issues.push("too-short");
  }
  if (text.length > 1800) {
    score -= 0.12;
    issues.push("too-long");
  }

  if (focusMode && !hasActionSignal(text)) {
    score -= 0.15;
    issues.push("focus-without-action");
  }

  if (/(绝对|100%|保证成功|guaranteed|certainly)/i.test(text)) {
    score -= 0.22;
    issues.push("over-certainty");
  }

  const normalized = clamp01(score);
  return {
    pass: normalized >= 0.58,
    score: Number(normalized.toFixed(3)),
    issues,
  };
}

function buildQualityRepairFeedback(quality = {}, options = {}) {
  const focusMode = Boolean(options.focusMode);
  const issueText = Array.isArray(quality.issues) && quality.issues.length ? quality.issues.join(", ") : "general-polish";
  const lines = [
    "Quality repair hints:",
    `- Previous draft issues: ${issueText}.`,
    "- Keep the same user intent; improve precision and execution clarity.",
    "- Remove any internal labels/tags and avoid certainty overclaim.",
    focusMode
      ? "- Focus mode is ON: include one immediate executable action."
      : "- Keep answer concise and natural.",
  ];
  return lines.join("\n");
}

function hasActionSignal(text) {
  return /(执行|开始|完成|提交|验证|安排|落地|先做|行动|implement|execute|start|ship|verify|deliver)/i.test(String(text || ""));
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

module.exports = {
  evaluateResponseQuality,
  buildQualityRepairFeedback,
};

