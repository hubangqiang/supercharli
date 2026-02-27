function assessMetacognition(input = {}) {
  const hasRisk = Array.isArray(input.riskSignals) && input.riskSignals.length > 0;
  const hasMemory = (Array.isArray(input.l1) && input.l1.length > 0) || (Array.isArray(input.recalled) && input.recalled.length > 0);
  const text = String(input.text || "");
  const uncertaintyCue = /(不确定|拿不准|不清楚|maybe|not sure|uncertain)/i.test(text);

  let confidence = 0.72;
  if (hasRisk) confidence -= 0.2;
  if (!hasMemory) confidence -= 0.08;
  if (uncertaintyCue) confidence -= 0.1;
  if (input.severity === "s3") confidence -= 0.08;
  confidence = Math.max(0.15, Math.min(0.95, confidence));

  const evidence = hasMemory ? "memory-supported" : "memory-light";
  return {
    confidence: Number(confidence.toFixed(2)),
    evidence,
    shouldEscalateThinking: confidence < 0.55 || hasRisk || input.severity === "s3",
  };
}

module.exports = { assessMetacognition };
