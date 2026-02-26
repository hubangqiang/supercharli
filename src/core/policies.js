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

  const hardCloseBySeverity = {
    normal: "别绕了，现在选一个方向并立刻动手。",
    s1: "先别纠结，30分钟内交付一个可见结果。",
    s2: "停掉犹豫，马上执行第一步，做完再汇报。",
    s3: "现在就止损：立刻执行最小动作，不再讨论。",
  };

  const base = trimmed.replace(/[？?]+\s*$/, "").replace(/\s+$/, "");
  return `${base}。${hardCloseBySeverity[severity] || hardCloseBySeverity.normal}`;
}

module.exports = { applyPersonaGuard, normalizeResponse, enforceHardEnding };
