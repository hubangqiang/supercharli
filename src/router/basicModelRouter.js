class BasicModelRouter {
  constructor() {
    this.fastModel = "fast-default";
    this.deepModel = "deep-default";
    this.secondaryModel = "safe-secondary";
  }

  selectRoute(input) {
    if (input.complexity === "deep") {
      return { route: "deep", model: this.deepModel, reason: "explicit-deep-request" };
    }

    const text = input.text.toLowerCase();
    if (text.includes("tradeoff") || text.includes("权衡") || text.includes("多步")) {
      return { route: "deep", model: this.deepModel, reason: "complex-planning-signal" };
    }

    return { route: "fast", model: this.fastModel, reason: "default-fast-route" };
  }

  async generate(model, context) {
    const lower = context.text.toLowerCase();

    if (model !== this.secondaryModel && lower.includes("force-error")) {
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
      content: `建议：聚焦一个目标并立即执行第一步。上下文命中 ${context.recalled.length} 条长期记忆。`,
    };
  }

  async regenerateSafe(model, context, reason) {
    return {
      model,
      content: `已修正：${reason}。请采用低风险、可验证路径，并用最小动作先确认方向。`,
      regenerated: true,
      responseMode: "guard-regenerated",
    };
  }

  async generateWithFallback(primaryModel, context) {
    const attempts = [];

    try {
      const result = await this.generate(primaryModel, context);
      return {
        result: { ...result, responseMode: "normal" },
        fallbackUsed: false,
        fallbackLevel: 0,
        attempts,
      };
    } catch (err) {
      attempts.push({ level: 1, model: primaryModel, reason: err.message });
    }

    try {
      const result = await this.generate(primaryModel, context);
      return {
        result: { ...result, responseMode: "normal" },
        fallbackUsed: true,
        fallbackLevel: 1,
        attempts,
      };
    } catch (err) {
      attempts.push({ level: 2, model: primaryModel, reason: err.message });
    }

    try {
      const result = await this.generate(this.secondaryModel, context);
      return {
        result: { ...result, responseMode: "degraded-secondary" },
        fallbackUsed: true,
        fallbackLevel: 2,
        attempts,
      };
    } catch (err) {
      attempts.push({ level: 3, model: this.secondaryModel, reason: err.message });
    }

    return {
      result: {
        model: "minimal-safe",
        content: "当前外部模型不可用。先执行一个最小可验证动作，并在 10 分钟后重试。",
        uncertainty: "模型链路暂时不可用，以下建议为保守降级方案。",
        responseMode: "minimal-safe",
      },
      fallbackUsed: true,
      fallbackLevel: 3,
      attempts,
    };
  }
}

module.exports = { BasicModelRouter };
