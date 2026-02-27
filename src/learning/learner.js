const { StageMachine } = require("./stageMachine");
const { LearningEvaluator } = require("./evaluator");
const { LearningPolicyUpdater } = require("./policyUpdater");
const { runConsolidationJob } = require("./jobs/consolidationJob");

class Learner {
  constructor(options = {}) {
    this.store = options.store || null;
    const persisted = this.store && typeof this.store.loadState === "function" ? this.store.loadState() : null;

    this.stageMachine =
      options.stageMachine ||
      new StageMachine({
        ...(options.stageOptions || {}),
        initialStage: persisted?.stage || options.stageOptions?.initialStage,
        initialStats: persisted?.stats || options.stageOptions?.initialStats,
      });
    this.evaluator = options.evaluator || new LearningEvaluator();
    this.policyUpdater =
      options.policyUpdater || new LearningPolicyUpdater(persisted?.policy || options.policy);
    this.events = this.store && typeof this.store.listRecentEvents === "function" ? this.store.listRecentEvents() : [];
    this.maxEventBuffer = options.maxEventBuffer || 200;
  }

  observeTurn(turn) {
    const event = this.evaluator.evaluateTurn(turn);
    this.events.push(event);
    if (this.events.length > this.maxEventBuffer) {
      this.events = this.events.slice(-this.maxEventBuffer);
    }
    if (this.store && typeof this.store.appendEvent === "function") {
      this.store.appendEvent(event);
    }

    const stage = this.stageMachine.observe(event);
    const policy = this.policyUpdater.apply(event, stage.stage);
    if (this.store && typeof this.store.saveState === "function") {
      this.store.saveState({
        stage: stage.stage,
        stats: stage.stats,
        policy: policy.policy,
      });
    }
    return {
      learned: event.shouldLearn,
      event,
      stage,
      policy,
    };
  }

  runConsolidation(maxCandidates = 5) {
    return runConsolidationJob({
      events: this.events,
      maxCandidates,
      stage: this.stageMachine.snapshot(),
      policy: this.policyUpdater.snapshot(),
    });
  }

  snapshot() {
    return {
      stage: this.stageMachine.snapshot(),
      policy: this.policyUpdater.snapshot(),
      eventCount: this.events.length,
    };
  }
}

module.exports = { Learner };
