function applyPersonaGuard(text, severity) {
  if (/guaranteed|100%|绝对成功/i.test(text)) {
    return {
      ok: false,
      reason: "fabricated certainty blocked",
    };
  }

  if (severity === "s3" && /all[- ]?in|孤注一掷/i.test(text)) {
    return {
      ok: false,
      reason: "high-risk suggestion blocked in S3",
    };
  }

  if (/(傻逼|智障|废物|滚蛋|去死|你真差劲|f\*\*k you|you idiot|moron)/i.test(text)) {
    return {
      ok: false,
      reason: "personal-attack language blocked",
    };
  }

  return { ok: true };
}

function normalizeResponse(generated, severity) {
  const raw = String(generated.content || "").trim() || "先收拢问题，我们从一个最小动作开始。";
  const conclusion = enforceHardEnding(raw, severity);

  return {
    conclusion,
    nextStep: "在 30 分钟内完成一个最小动作，并记录结果。",
    completionSignal: "你能明确说出：已完成动作 + 下一步时间点。",
    fallbackOption: "如果阻力大，先做 10 分钟版本并保留连续性。",
    uncertainty: generated.uncertainty,
  };
}

function enforceHardEnding(text, severity) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "先收拢问题，我们从一个最小动作开始。";

  const softQuestionTail = /(你是想|你愿意|要不要|是否|吗[？?]?$|么[？?]?$|呢[？?]?$|可以吗[？?]?$|好不好[？?]?$|would you|do you want|which one|a or b)/i;
  const endingIsQuestion = /[？?]\s*$/.test(trimmed) || softQuestionTail.test(trimmed);
  if (!endingIsQuestion) return trimmed;

  const closeBySeverity = {
    normal: "请先确定一个方向，并开始最小可验证动作。",
    s1: "建议先稳定节奏，在30分钟内完成一个最小可见结果。",
    s2: "请立即执行第一步，并在完成后记录结果与下一步时间点。",
    s3: "当前优先止损：请先执行最小风险动作，再评估后续路径。",
  };

  const base = trimmed.replace(/[？?]+\s*$/, "").replace(/\s+$/, "");
  return `${base}。${closeBySeverity[severity] || closeBySeverity.normal}`;
}

module.exports = { applyPersonaGuard, normalizeResponse, enforceHardEnding };
