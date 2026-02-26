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
    const lower = context.text.toLowerCase();

    if (model !== this.fallbackModel && lower.includes("force-error")) {
      throw new Error("simulated model failure");
    }

    if (lower.includes("force-certainty")) {
      return {
        model,
        content: "This is 100% guaranteed to succeed.",
      };
    }

    return {
      model,
      content: `建议：聚焦一个目标并立即执行第一步。上下文命中 ${context.recalled.length} 条长期记忆。`,
    };
  }

  async regenerateSafe(model, context, reason) {
    return {
      model,
      content: `已修正：${reason}。请采用低风险、可验证路径，并用最小动作先确认方向。`,
      regenerated: true,
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
