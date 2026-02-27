class LearningPolicyUpdater {
  constructor(initial = {}) {
    this.policy = {
      directness: initial.directness ?? 0.7,
      actionPressure: initial.actionPressure ?? 0.75,
      reflectionDepth: initial.reflectionDepth ?? 0.45,
      explorationBias: initial.explorationBias ?? 0.5,
    };
  }

  apply(event = {}, stage = "apprentice") {
    const delta = {
      directness: 0,
      actionPressure: 0,
      reflectionDepth: 0,
      explorationBias: 0,
    };

    if (event.outcome === "failure") {
      delta.directness += 0.03;
      delta.actionPressure += 0.04;
    }
    if (event.outcome === "success") {
      delta.reflectionDepth += 0.02;
      delta.explorationBias += 0.01;
    }
    if (event.patternKey === "decision-conflict-loop") delta.reflectionDepth += 0.03;
    if (event.patternKey === "procrastination-loop") delta.actionPressure += 0.04;
    if (event.severity === "s3") delta.explorationBias -= 0.04;

    if (stage === "transfer" || stage === "autonomous") {
      delta.reflectionDepth += 0.01;
    }

    for (const key of Object.keys(this.policy)) {
      this.policy[key] = clamp(this.policy[key] + delta[key], 0.1, 1);
    }

    return { delta, policy: { ...this.policy } };
  }

  snapshot() {
    return { ...this.policy };
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = { LearningPolicyUpdater };
