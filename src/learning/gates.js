function evaluateLearningGates(metrics = {}, options = {}) {
  const cfg = {
    minSamples: options.minSamples || 30,
    minAcr: options.minAcr || 0.4,
    maxFailureRate: options.maxFailureRate || 0.45,
    maxRecurrenceRate: options.maxRecurrenceRate || 0.8,
  };

  const g0 = metrics.total >= cfg.minSamples;
  const g1 = metrics.successRate >= cfg.minAcr;
  const g2 = metrics.failureRate <= cfg.maxFailureRate;
  const g3 = metrics.recurrenceRate <= cfg.maxRecurrenceRate;
  const pass = g0 && g1 && g2 && g3;

  return {
    pass,
    gates: {
      g0_data_sufficiency: g0,
      g1_quality_gain_proxy: g1,
      g2_risk_constraint: g2,
      g3_stability_proxy: g3,
    },
    metrics,
    thresholds: cfg,
  };
}

module.exports = { evaluateLearningGates };
