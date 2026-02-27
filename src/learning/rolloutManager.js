function decideRollout(input = {}) {
  const gate = input.gate || { pass: false };
  const current = input.current || { ratio: 0, enabled: false, version: null };
  const metrics = input.metrics || {};
  const cfg = {
    initialRatio: input.initialRatio || 0.1,
    step: input.step || 0.2,
    maxRatio: input.maxRatio || 1,
    rollbackFailureRate: input.rollbackFailureRate || 0.5,
  };

  if (shouldRollback(metrics, cfg)) {
    return {
      action: "rollback",
      rollout: { enabled: false, ratio: 0, version: current.version },
      reason: "risk-regression-detected",
    };
  }

  if (!gate.pass) {
    return {
      action: "hold",
      rollout: current,
      reason: "gate-not-passed",
    };
  }

  if (!current.enabled) {
    return {
      action: "activate",
      rollout: {
        enabled: true,
        ratio: cfg.initialRatio,
        version: current.version,
      },
      reason: "initial-gray-rollout",
    };
  }

  const nextRatio = Math.min(cfg.maxRatio, Number((current.ratio + cfg.step).toFixed(2)));
  if (nextRatio === current.ratio) {
    return {
      action: "hold",
      rollout: current,
      reason: "already-at-max-ratio",
    };
  }

  return {
    action: "ramp",
    rollout: { ...current, ratio: nextRatio },
    reason: "gate-stable-ramp-up",
  };
}

function shouldRollback(metrics, cfg) {
  const failureRate = Number(metrics.failureRate || 0);
  return failureRate > cfg.rollbackFailureRate;
}

module.exports = { decideRollout, shouldRollback };
