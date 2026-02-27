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

  return { mode: "fast", reason: "default-fast-thinking", complexity: null };
}

module.exports = { selectThinkingMode };
