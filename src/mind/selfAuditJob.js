function runSelfAudit(input = {}) {
  const policy = input.policy || {};
  const findings = [];

  if (policy.directness > 0.98) {
    findings.push("directness too high, risk of over-aggressive tone");
  }
  if (policy.actionPressure > 0.98) {
    findings.push("actionPressure too high, risk of reduced reflection quality");
  }
  if (policy.reflectionDepth < 0.2) {
    findings.push("reflectionDepth too low, risk of shallow recommendations");
  }

  return {
    status: findings.length ? "attention-needed" : "healthy",
    findings,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { runSelfAudit };
