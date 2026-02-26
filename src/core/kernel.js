const crypto = require("crypto");
const { applyPersonaGuard, normalizeResponse } = require("./policies");
const { SeverityStateMachine } = require("./severityStateMachine");
const { Telemetry } = require("../observability/telemetry");

class Kernel {
  constructor(memoryEngine, router, severityMachine = new SeverityStateMachine(), telemetry = new Telemetry()) {
    this.memory = memoryEngine;
    this.router = router;
    this.severity = severityMachine;
    this.telemetry = telemetry;
  }

  async runTurn(input) {
    const traceId = crypto.randomUUID();
    const started = Date.now();
    this.telemetry.log({ stage: "ingest", traceId, sessionId: input.sessionId });

    const severityInfo = this.severity.resolveDetailed(input);
    const severity = severityInfo.severity;
    this.telemetry.log({ stage: "severity", traceId, ...severityInfo });

    const l1 = this.memory.readL1(input.sessionId);
    const recalled = this.memory.recallL2(input.text);
    this.telemetry.log({
      stage: "recall",
      traceId,
      l1Count: l1.length,
      l2RecallCount: recalled.length,
    });

    const route = this.router.selectRoute(input);
    this.telemetry.log({
      stage: "route",
      traceId,
      route: route.route,
      provider: route.model.provider,
      model: route.model.model,
      reason: route.reason,
    });

    const generation = await this.router.generateWithFallback(route.model, {
      text: input.text,
      l1,
      recalled,
      severity,
    });
    this.telemetry.log({
      stage: "generate",
      traceId,
      provider: generation.result.provider,
      model: generation.result.model,
      fallbackUsed: Boolean(generation.fallbackUsed),
      fallbackLevel: generation.fallbackLevel || 0,
      attempts: generation.attempts || [],
    });

    const guard = applyPersonaGuard(generation.result.content, severity);
    const generated = guard.ok
      ? generation.result
      : await this.router.regenerateSafe(
          generation.result,
          {
            text: input.text,
            l1,
            recalled,
            severity,
          },
          guard.reason,
        );

    if (!guard.ok) {
      this.telemetry.inc("persona_violation_count");
      this.telemetry.log({ stage: "guard", traceId, ok: false, reason: guard.reason });
    } else {
      this.telemetry.log({ stage: "guard", traceId, ok: true });
    }

    const response = normalizeResponse(generated, severity);
    this.telemetry.log({ stage: "normalize", traceId, responseMode: generated.responseMode || "normal" });

    const entry = {
      text: input.text,
      severity,
      traceId,
      createdAt: new Date().toISOString(),
    };
    this.memory.writeL1(input.sessionId, entry);
    const promotedToL2 = this.memory.evaluatePromotion(entry);
    this.telemetry.log({ stage: "persist", traceId, promotedToL2 });

    this.telemetry.inc("turn_count");
    this.telemetry.inc(`route_${route.route}_count`);
    if (generation.fallbackUsed) {
      this.telemetry.inc("fallback_activation_count");
      if (generation.fallbackLevel === 3) {
        this.telemetry.inc("minimal_safe_response_count");
      }
    }

    const latencyMs = Date.now() - started;
    this.telemetry.log({ stage: "done", traceId, latencyMs });

    return {
      response,
      meta: {
        route: route.route,
        routeReason: route.reason,
        modelProvider: generation.result.provider,
        model: generation.result.model,
        fallbackUsed: Boolean(generation.fallbackUsed),
        fallbackLevel: generation.fallbackLevel || 0,
        responseMode: generated.responseMode || "normal",
        severity,
        severityReason: severityInfo.reason,
        promotedToL2,
        traceId,
        regenerated: Boolean(generated.regenerated),
        latencyMs,
      },
    };
  }
}

module.exports = { Kernel };
