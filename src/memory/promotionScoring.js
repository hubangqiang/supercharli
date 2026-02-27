function computePromotionScore(entry = {}, signal = {}) {
  const repeatCount = Number(signal.repeatCount || 0);
  const threshold = Number(signal.threshold || 3);
  const recurrence = clamp(repeatCount / Math.max(1, threshold), 0, 1);

  const severity = severityWeight(entry.severity);
  const action = actionSignalWeight(entry.text);
  const impact = impactSignalWeight(entry.text);

  // Weighted for predictable threshold behavior and easy tuning.
  const score = recurrence * 0.5 + severity * 0.2 + action * 0.15 + impact * 0.15;
  return {
    score,
    shouldPromote: score >= Number(signal.scoreThreshold || 0.65),
    components: { recurrence, severity, action, impact },
  };
}

function severityWeight(severity) {
  if (severity === "s3") return 1;
  if (severity === "s2") return 0.85;
  if (severity === "s1") return 0.7;
  return 0.55;
}

function actionSignalWeight(text) {
  const t = String(text || "").toLowerCase();
  if (/(完成|执行|提交|done|finished|launched|shipped)/i.test(t)) return 0.9;
  if (/(开始|先做|start|first step|动手)/i.test(t)) return 0.7;
  return 0.45;
}

function impactSignalWeight(text) {
  const t = String(text || "").toLowerCase();
  if (/(关键|重要|高风险|止损|deadline|critical|risk|urgent)/i.test(t)) return 0.9;
  if (/(计划|目标|推进|plan|goal|progress)/i.test(t)) return 0.7;
  return 0.5;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = { computePromotionScore };
