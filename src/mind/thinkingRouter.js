function selectThinkingMode(input = {}) {
  if (input.complexity === "deep") {
    return { mode: "deliberate", reason: "explicit-deep-request", complexity: "deep" };
  }

  if (input.metacognition?.shouldEscalateThinking) {
    return { mode: "deliberate", reason: "metacognitive-escalation", complexity: "deep" };
  }

  if (input.severity === "s3") {
    return { mode: "deliberate", reason: "high-severity-deliberation", complexity: "deep" };
  }

  const l4Boundaries = Array.isArray(input.l4?.boundaries) ? input.l4.boundaries : [];
  const text = String(input.text || "").toLowerCase();
  if (
    l4Boundaries.includes("no-fabrication") &&
    /(绝对|100%|guaranteed|一定成功)/i.test(text)
  ) {
    return { mode: "deliberate", reason: "l4-boundary-sensitive", complexity: "deep" };
  }

  return { mode: "fast", reason: "default-fast-thinking", complexity: null };
}

module.exports = { selectThinkingMode };
