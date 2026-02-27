const { assessMetacognition } = require("./metacognition");
const { selectThinkingMode } = require("./thinkingRouter");
const { buildGlobalWorkspace } = require("./globalWorkspace");
const { InMemorySelfModelStore } = require("./selfModelStore");
const { runSelfAudit } = require("./selfAuditJob");

class MindRuntime {
  constructor(options = {}) {
    this.selfModelStore = options.selfModelStore || new InMemorySelfModelStore(options.selfModel);
  }

  prepareTurn(input = {}) {
    const selfModel = this.selfModelStore.read();
    const metacognition = assessMetacognition(input);
    const thinking = selectThinkingMode({
      complexity: input.complexity,
      severity: input.severity,
      metacognition,
    });
    const workspace = buildGlobalWorkspace({
      goal: input.goal || input.text,
      personaConstraint: selfModel.identity,
      severity: input.severity,
      l1: input.l1,
      recalled: input.recalled,
    });

    return {
      selfModel,
      metacognition,
      thinking,
      workspace,
    };
  }

  finalizeTurn(learning = {}) {
    if (learning?.stage?.stage) {
      this.selfModelStore.write({ stage: learning.stage.stage });
    }
    return runSelfAudit({ policy: learning?.policy?.policy || {} });
  }
}

module.exports = { MindRuntime };
