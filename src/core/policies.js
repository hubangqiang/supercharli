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
  const conclusion = String(generated.content || "").trim() || "先收拢问题，我们从一个最小动作开始。";

  return {
    conclusion,
    nextStep: "在 30 分钟内完成一个最小动作，并记录结果。",
    completionSignal: "你能明确说出：已完成动作 + 下一步时间点。",
    fallbackOption: "如果阻力大，先做 10 分钟版本并保留连续性。",
    uncertainty: generated.uncertainty,
  };
}

module.exports = { applyPersonaGuard, normalizeResponse };
