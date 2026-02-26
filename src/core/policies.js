function resolveSeverity(input) {
  const signals = input.riskSignals || [];
  const text = input.text.toLowerCase();

  const hasS3Signal = signals.includes("guardrail-risk") || text.includes("不可逆") || text.includes("high-risk");
  if (hasS3Signal) return "s3";

  const hasS2Signal = signals.includes("repeated-failure") || text.includes("连续失败") || text.includes("拖延");
  if (hasS2Signal) return "s2";

  const hasS1Signal = signals.includes("stress-rise") || text.includes("焦虑") || text.includes("压力");
  if (hasS1Signal) return "s1";

  return "normal";
}

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
  };
}

module.exports = { resolveSeverity, applyPersonaGuard, normalizeResponse };
