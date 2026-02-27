function runConsolidationJob(input = {}) {
  const events = Array.isArray(input.events) ? input.events : [];
  const maxCandidates = Number(input.maxCandidates || 5);
  const learnable = events.filter((e) => e.shouldLearn);
  const latest = learnable.slice(-maxCandidates);

  const candidates = latest.map((e, idx) => ({
    id: `${e.patternKey}-${idx}-${Date.now()}`,
    type: "policy-adjustment",
    patternKey: e.patternKey,
    reason: `${e.outcome} signal under ${e.severity}`,
    confidence: e.outcome === "neutral" ? 0.55 : 0.72,
    createdAt: new Date().toISOString(),
  }));

  return {
    inputEvents: events.length,
    candidates,
    summary: {
      promotedCandidates: candidates.length,
      learnableEvents: learnable.length,
    },
  };
}

module.exports = { runConsolidationJob };
