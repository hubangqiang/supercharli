const { StageMachine } = require("./stageMachine");
const { LearningEvaluator } = require("./evaluator");
const { LearningPolicyUpdater } = require("./policyUpdater");
const { runConsolidationJob } = require("./jobs/consolidationJob");

class Learner {
  constructor(options = {}) {
    this.stageMachine = options.stageMachine || new StageMachine(options.stageOptions);
    this.evaluator = options.evaluator || new LearningEvaluator();
    this.policyUpdater = options.policyUpdater || new LearningPolicyUpdater(options.policy);
    this.events = [];
    this.maxEventBuffer = options.maxEventBuffer || 200;
  }

  observeTurn(turn) {
    const event = this.evaluator.evaluateTurn(turn);
    this.events.push(event);
    if (this.events.length > this.maxEventBuffer) {
      this.events = this.events.slice(-this.maxEventBuffer);
    }

    const stage = this.stageMachine.observe(event);
    const policy = this.policyUpdater.apply(event, stage.stage);
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
