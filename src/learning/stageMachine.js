class StageMachine {
  constructor(options = {}) {
    this.stage = options.initialStage || "apprentice";
    this.stats = options.initialStats || {
      total: 0,
      success: 0,
      failures: 0,
      patternHits: 0,
      stableTurns: 0,
    };
  }

  observe(event = {}) {
    this.stats.total += 1;
    if (event.outcome === "success") this.stats.success += 1;
    if (event.outcome === "failure") this.stats.failures += 1;
    if (event.patternKey && event.patternKey !== "general-execution-pattern") this.stats.patternHits += 1;
    if (event.shouldLearn && event.severity !== "s3") this.stats.stableTurns += 1;

    this.stage = this._nextStage();
    return { stage: this.stage, stats: this.snapshotStats() };
  }

  snapshot() {
    return { stage: this.stage, stats: this.snapshotStats() };
  }

  snapshotStats() {
    const total = Math.max(1, this.stats.total);
    return {
      ...this.stats,
      successRate: Number((this.stats.success / total).toFixed(3)),
      patternRate: Number((this.stats.patternHits / total).toFixed(3)),
    };
  }

  _nextStage() {
    const total = this.stats.total;
    const successRate = this.stats.success / Math.max(1, total);
    const patternHits = this.stats.patternHits;
    const stableTurns = this.stats.stableTurns;
    const failures = this.stats.failures;

    if (failures >= 8 && this.stage === "autonomous") return "transfer";
    if (failures >= 10 && this.stage === "transfer") return "pattern";

    if (total >= 24 && successRate >= 0.65 && patternHits >= 8 && stableTurns >= 12) {
      return "autonomous";
    }
    if (total >= 12 && successRate >= 0.55 && patternHits >= 4) {
      return "transfer";
    }
    if (total >= 5 && successRate >= 0.4) {
      return "pattern";
    }
    return "apprentice";
  }
}

module.exports = { StageMachine };
