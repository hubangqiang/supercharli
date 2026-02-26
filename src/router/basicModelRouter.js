class BasicModelRouter {
  constructor() {
    this.fastModel = "fast-default";
    this.deepModel = "deep-default";
    this.fallbackModel = "safe-fallback";
  }

  selectRoute(input) {
    if (input.complexity === "deep") {
      return { route: "deep", model: this.deepModel };
    }

    const text = input.text.toLowerCase();
    if (text.includes("tradeoff") || text.includes("权衡") || text.includes("多步")) {
      return { route: "deep", model: this.deepModel };
    }

    return { route: "fast", model: this.fastModel };
  }

  async generate(model, context) {
    if (model !== this.fallbackModel && context.text.toLowerCase().includes("force-error")) {
      throw new Error("simulated model failure");
    }

    return {
      model,
      content: `建议：聚焦一个目标并立即执行第一步。上下文命中 ${context.recalled.length} 条长期记忆。`,
    };
  }

  async generateWithFallback(primaryModel, context) {
    try {
      const result = await this.generate(primaryModel, context);
      return { result, fallbackUsed: false };
    } catch {
      const result = await this.generate(this.fallbackModel, context);
      return { result, fallbackUsed: true, fallbackModel: this.fallbackModel };
    }
  }
}

module.exports = { BasicModelRouter };
