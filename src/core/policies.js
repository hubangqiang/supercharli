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

  return { ok: true };
}

function normalizeResponse(generated, severity) {
  const prefix = {
    normal: "先稳住节奏，",
    s1: "你现在有压力但可控，",
    s2: "先停掉分散任务，",
    s3: "现在先止损，",
  }[severity];

  return {
    conclusion: `${prefix}${generated.content}`,
    nextStep: "在 30 分钟内完成一个最小动作，并记录结果。",
    completionSignal: "你能明确说出：已完成动作 + 下一步时间点。",
    fallbackOption: "如果阻力大，先做 10 分钟版本并保留连续性。",
    uncertainty: generated.uncertainty,
  };
}

module.exports = { applyPersonaGuard, normalizeResponse };
