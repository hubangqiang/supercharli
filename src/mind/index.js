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
    const l4 = input.l4 && typeof input.l4 === "object" ? input.l4 : {};
    const mergedBoundaries = uniq([...(selfModel.boundaries || []), ...(Array.isArray(l4.boundaries) ? l4.boundaries : [])]);
    const metacognition = assessMetacognition(input);
    const thinking = selectThinkingMode({
      text: input.text,
      complexity: input.complexity,
      severity: input.severity,
      metacognition,
      l4: { ...l4, boundaries: mergedBoundaries },
    });
    const workspace = buildGlobalWorkspace({
      goal: input.goal || input.text,
      personaConstraint: selfModel.identity,
      severity: input.severity,
      l1: input.l1,
      recalled: input.recalled,
      l3: input.l3,
      l4: { ...l4, boundaries: mergedBoundaries, values: uniq([...(selfModel.values || []), ...(Array.isArray(l4.values) ? l4.values : [])]) },
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

function uniq(arr) {
  return Array.from(new Set(arr));
}

module.exports = { MindRuntime, SQLiteSelfModelStore };
