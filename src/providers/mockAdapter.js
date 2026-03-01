class MockAdapter {
  constructor(name = "mock") {
    this.name = name;
  }

  async generate(model, context) {
    const lower = String(context.text || "").toLowerCase();

    if (model !== "safe-secondary" && lower.includes("force-error")) {
      throw new Error("simulated model failure");
    }

    if (lower.includes("force-all-fail")) {
      throw new Error("simulated chain failure");
    }

    if (lower.includes("force-certainty")) {
      return {
        model,
        content: "This is 100% guaranteed to succeed.",
      };
    }

    return {
      model,
      content: buildSimulationNotice(context),
    };
  }
}

function buildSimulationNotice(context = {}) {
  const stage = context.learningStage || "apprentice";
  return `当前处于本地模拟模式（mock），仅用于链路联调，不代表真实大模型能力。请配置外部模型后再进行学习与记忆质量评估。当前学习阶段标记：${stage}。`;
}

module.exports = { MockAdapter };
