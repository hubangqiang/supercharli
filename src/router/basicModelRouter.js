const { createProviderRegistry } = require("../providers/providerRegistry");

class BasicModelRouter {
  constructor(options = {}) {
    this.registry = options.registry || createProviderRegistry(options.env);
    this.fastModel = options.fastModel || this.registry.models.fast;
    this.deepModel = options.deepModel || this.registry.models.deep;
    this.secondaryModel = options.secondaryModel || this.registry.models.secondary;
  }

  selectRoute(input) {
    if (input.complexity === "deep") {
      return { route: "deep", model: this.deepModel, reason: "explicit-deep-request" };
    }

    const text = String(input.text || "").toLowerCase();
    if (text.includes("tradeoff") || text.includes("权衡") || text.includes("多步")) {
      return { route: "deep", model: this.deepModel, reason: "complex-planning-signal" };
    }

    return { route: "fast", model: this.fastModel, reason: "default-fast-route" };
  }

  async generate(modelRef, context) {
    return this.registry.generate(modelRef, context);
  }

  async regenerateSafe(modelRef, context, reason) {
    const modelName = typeof modelRef === "string" ? modelRef : modelRef.model;
    const providerName = typeof modelRef === "string" ? "local" : modelRef.provider;

    return {
      provider: providerName,
      model: modelName,
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
      attempts.push({ level: 1, provider: primaryModel.provider, model: primaryModel.model, reason: err.message });
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
      attempts.push({ level: 2, provider: primaryModel.provider, model: primaryModel.model, reason: err.message });
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
      attempts.push({
        level: 3,
        provider: this.secondaryModel.provider,
        model: this.secondaryModel.model,
        reason: err.message,
      });
    }

    return {
      result: {
        provider: "local",
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
