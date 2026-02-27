const { StageMachine } = require("./stageMachine");
const { LearningEvaluator } = require("./evaluator");
const { LearningPolicyUpdater } = require("./policyUpdater");
const { runConsolidationJob } = require("./jobs/consolidationJob");
const { evaluateLearningGates } = require("./gates");

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
    this.gateConfig = options.gateConfig || {};
    this.autoActivate = Boolean(options.autoActivate);
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
    const metrics = this.store && typeof this.store.summarizeRecentOutcomes === "function"
      ? this.store.summarizeRecentOutcomes(this.gateConfig.windowSize || 40)
      : summarizeRecentOutcomes(this.events, this.gateConfig.windowSize || 40);
    const gate = evaluateLearningGates(metrics, this.gateConfig);

    if (this.store && event.shouldLearn && typeof this.store.saveCandidate === "function") {
      this.store.saveCandidate({
        createdAt: new Date().toISOString(),
        event,
        gates: gate,
        proposedPolicy: policy.policy,
        status: gate.pass ? "approved" : "pending",
      });
    }

    let policyVersion = null;
    if (this.autoActivate && gate.pass && this.store && typeof this.store.savePolicyVersion === "function") {
      policyVersion = this.store.savePolicyVersion({
        policy: policy.policy,
        gates: gate,
        note: "auto-activated-by-gates",
      });
    }

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
      gate,
      policyVersion,
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

function summarizeRecentOutcomes(events, windowSize) {
  const rows = (Array.isArray(events) ? events : []).slice(-windowSize);
  const total = rows.length;
  const success = rows.filter((r) => r.outcome === "success").length;
  const failure = rows.filter((r) => r.outcome === "failure").length;
  const repeated = rows.filter((r) => r.patternKey && r.patternKey !== "general-execution-pattern").length;
  return {
    total,
    success,
    failure,
    repeated,
    successRate: total ? success / total : 0,
    recurrenceRate: total ? repeated / total : 0,
    failureRate: total ? failure / total : 0,
  };
}

module.exports = { Learner };
