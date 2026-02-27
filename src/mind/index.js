const { assessMetacognition } = require("./metacognition");
const { selectThinkingMode } = require("./thinkingRouter");
const { buildGlobalWorkspace } = require("./globalWorkspace");
const { InMemorySelfModelStore } = require("./selfModelStore");
const { SQLiteSelfModelStore } = require("./sqliteSelfModelStore");
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
    const current = this.selfModelStore.read();
    if (learning?.stage?.stage) {
      this.selfModelStore.write({ stage: learning.stage.stage });
    }
    const gatePassCount = (current.gatePassCount || 0) + (learning?.gate?.pass ? 1 : 0);
    const gateFailCount = (current.gateFailCount || 0) + (learning?.gate?.pass ? 0 : 1);
    const patch = {
      gatePassCount,
      gateFailCount,
      lastPolicyVersion: learning?.policyVersion || current.lastPolicyVersion || null,
    };
    const selfAudit = runSelfAudit({ policy: learning?.policy?.policy || {} });
    patch.lastAuditStatus = selfAudit.status;
    this.selfModelStore.write(patch);
    return selfAudit;
  }

  snapshot() {
    return this.selfModelStore.read();
  }
}

module.exports = { MindRuntime, SQLiteSelfModelStore };
