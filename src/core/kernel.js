const crypto = require("crypto");
const { resolveSeverity, applyPersonaGuard, normalizeResponse } = require("./policies");

class Kernel {
  constructor(memoryEngine, router) {
    this.memory = memoryEngine;
    this.router = router;
  }

  async runTurn(input) {
    const traceId = crypto.randomUUID();

    const severity = resolveSeverity(input);
    const l1 = this.memory.readL1(input.sessionId);
    const recalled = this.memory.recallL2(input.text);

    const route = this.router.selectRoute(input);
    const generation = await this.router.generateWithFallback(route.model, {
      text: input.text,
      l1,
      recalled,
      severity,
    });

    const guard = applyPersonaGuard(generation.result.content, severity);
    const generated = guard.ok
      ? generation.result
      : await this.router.regenerateSafe(generation.result.model, {
          text: input.text,
          l1,
          recalled,
          severity,
        }, guard.reason);

    const response = normalizeResponse(generated, severity);

    const entry = {
      text: input.text,
      severity,
      traceId,
      createdAt: new Date().toISOString(),
    };
    this.memory.writeL1(input.sessionId, entry);
    const promotedToL2 = this.memory.evaluatePromotion(entry);

    return {
      response,
      meta: {
        route: route.route,
        model: generation.result.model,
        fallbackUsed: Boolean(generation.fallbackUsed),
        severity,
        promotedToL2,
        traceId,
        regenerated: Boolean(generated.regenerated),
      },
    };
  }
}

module.exports = { Kernel };
