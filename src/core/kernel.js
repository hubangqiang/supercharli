const crypto = require("crypto");
const { applyPersonaGuard, normalizeResponse } = require("./policies");
const { SeverityStateMachine } = require("./severityStateMachine");
const { Telemetry } = require("../observability/telemetry");

class Kernel {
  constructor(memoryEngine, router, severityMachine = new SeverityStateMachine(), telemetry = new Telemetry(), learner = null, mind = null) {
    this.memory = memoryEngine;
    this.router = router;
    this.severity = severityMachine;
    this.telemetry = telemetry;
    this.learner = learner;
    this.mind = mind;
  }

  async runTurn(input) {
    const traceId = crypto.randomUUID();
    const started = Date.now();
    this.telemetry.log({ stage: "ingest", traceId, sessionId: input.sessionId });
    const focusMode = isWorkFocusRequest(input.text);

    const severityInfo = this.severity.resolveDetailed(input);
    const severity = severityInfo.severity;
    this.telemetry.log({ stage: "severity", traceId, ...severityInfo });
    this.telemetry.log({ stage: "focus", traceId, focusMode });

    const l1 = this.memory.readL1(input.sessionId);
    const recalled = this.memory.recallL2(input.text);
    const l3 = typeof this.memory.readL3Milestones === "function" ? this.memory.readL3Milestones(1) : [];
    const l4 = typeof this.memory.readL4Identity === "function" ? this.memory.readL4Identity() : {};
    this.telemetry.log({
      stage: "recall",
      traceId,
      l1Count: l1.length,
      l2RecallCount: recalled.length,
      l3RecallCount: l3.length,
      l4Keys: Object.keys(l4 || {}).length,
    });

    const mindCtx =
      this.mind && typeof this.mind.prepareTurn === "function"
        ? this.mind.prepareTurn({
            text: input.text,
            complexity: focusMode ? "deep" : input.complexity,
            severity,
            riskSignals: input.riskSignals,
            l1,
            recalled,
            l3,
            l4,
            focusMode,
          })
        : null;

    const effectiveComplexity = focusMode ? "deep" : mindCtx?.thinking?.complexity || input.complexity;
    const route = this.router.selectRoute({ ...input, complexity: effectiveComplexity, focusMode });
    this.telemetry.log({
      stage: "route",
      traceId,
      route: route.route,
      provider: route.model.provider,
      model: route.model.model,
      reason: route.reason,
    });

    const learningSnapshot =
      this.learner && typeof this.learner.snapshot === "function" ? this.learner.snapshot() : null;

    const generation = await this.router.generateWithFallback(route.model, {
      text: input.text,
      l1,
      recalled,
      severity,
      personaProfile: input.personaProfile,
      learningStage: learningSnapshot?.stage?.stage,
      learningPolicy: learningSnapshot?.policy,
      metacognitiveConfidence: mindCtx?.metacognition?.confidence,
      thinkingMode: mindCtx?.thinking?.mode,
      workspace: mindCtx?.workspace?.blocks,
      l3,
      l4,
      focusMode,
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
    const augmentationMode = resolveAugmentationMode(generation.result.provider);

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
            personaProfile: input.personaProfile,
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

    const activeLearning = isActiveLearningRequest(input.text) || focusMode;
    const modelLearningSignals =
      activeLearning && this.router && typeof this.router.generate === "function" && augmentationMode === "external-model-augmented"
        ? await extractModelLearningSignals(this.router, route.model, input.text, generated.content)
        : null;
    let learning = null;
    if (this.learner && typeof this.learner.observeTurn === "function") {
      learning = this.learner.observeTurn({
        sessionId: input.sessionId,
        text: input.text,
        severity,
        route: route.route,
        fallbackUsed: Boolean(generation.fallbackUsed),
        activeLearning,
        focusMode,
        modelSignals: modelLearningSignals,
      });
      this.telemetry.log({
        stage: "learn",
        traceId,
        learned: learning.learned,
        learningStage: learning.stage?.stage,
      });
    }

    if (
      learning?.event?.signalSource === "model-extracted" &&
      learning?.event?.shouldLearn &&
      learning?.event?.patternKey &&
      learning?.event?.patternKey !== "general-execution-pattern" &&
      this.memory &&
      typeof this.memory.upsertL2Pattern === "function"
    ) {
      this.memory.upsertL2Pattern({
        key: learning.event.patternKey,
        summary: learning.event.summary || `Model extracted pattern: ${learning.event.patternKey}`,
        strategy: learning.event.strategy || "",
        confidence: Number(learning.event.signalConfidence || 0.7),
        source: "model-extracted",
      });
    }

    const selfAudit =
      this.mind && typeof this.mind.finalizeTurn === "function" ? this.mind.finalizeTurn(learning) : null;
    if (selfAudit) {
      this.telemetry.log({
        stage: "self-audit",
        traceId,
        status: selfAudit.status,
        findings: selfAudit.findings?.length || 0,
      });
    }

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
        learningStage: learning?.stage?.stage,
        policySnapshot: learning?.policy?.policy,
        metacognitiveConfidence: mindCtx?.metacognition?.confidence,
        thinkingMode: mindCtx?.thinking?.mode,
        thinkingReason: mindCtx?.thinking?.reason,
        selfAuditStatus: selfAudit?.status,
        activeLearningRequested: activeLearning,
        focusMode,
        augmentationMode,
        usingExternalModel: augmentationMode === "external-model-augmented",
        boundaryNote: "local-memory-learning-augment-only",
        learningSignalSource: learning?.event?.signalSource || "none",
        learningSignalConfidence: learning?.event?.signalConfidence || 0,
        learningSignalSummary: learning?.event?.summary || "",
      },
    };
  }
}

function isActiveLearningRequest(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return false;
  const patterns = [
    /分析学习/,
    /主动学习/,
    /复盘/,
    /总结(一下|下)?/,
    /我教你|记住这个|模板是|按这个格式/,
    /learn\b/,
    /reflect\b/,
  ];
  return patterns.some((p) => p.test(s));
}

function isWorkFocusRequest(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return false;
  const patterns = [
    /具体工作/,
    /工作/,
    /项目/,
    /开发/,
    /编码|代码|bug|调试|测试/,
    /需求|排期|里程碑|交付|上线|发布/,
    /\b(pr|merge|review|deploy|release|roadmap|sprint|ticket)\b/,
  ];
  return patterns.some((p) => p.test(s));
}

function resolveAugmentationMode(provider) {
  return provider === "mock" || provider === "local" ? "simulation-local" : "external-model-augmented";
}

async function extractModelLearningSignals(router, modelRef, userText, assistantText) {
  const lang = detectLanguage(userText);
  const isZh = lang === "zh";
  const prompt = [
    isZh ? "你是学习信号提炼器。" : "You are a learning-signal extractor.",
    isZh
      ? "基于用户输入和助手回复，提炼一个可复用学习信号。"
      : "Given user input and assistant response, extract one reusable learning signal.",
    isZh
      ? "只返回JSON，字段为：patternKey, outcome(success|failure|neutral), shouldLearn(boolean), summary, strategy, confidence(0-1)。"
      : "Return JSON only with keys: patternKey, outcome(success|failure|neutral), shouldLearn(boolean), summary, strategy, confidence(0-1).",
    isZh
      ? "summary 和 strategy 使用中文。若无有效信号，shouldLearn=false 且 patternKey='general-execution-pattern'。"
      : "Use English for summary/strategy. If no meaningful signal, set shouldLearn=false and patternKey='general-execution-pattern'.",
    "",
    `${isZh ? "用户" : "User"}: ${String(userText || "").slice(0, 1200)}`,
    `${isZh ? "助手" : "Assistant"}: ${String(assistantText || "").slice(0, 1200)}`,
  ].join("\n");

  try {
    const out = await router.generate(modelRef, {
      text: prompt,
      l1: [],
      recalled: [],
      severity: "normal",
      personaProfile: null,
      extractorMode: true,
    });
    return parseLearningSignalJson(out?.content || "");
  } catch {
    return null;
  }
}

function parseLearningSignalJson(text) {
  const raw = String(text || "");
  const block = raw.match(/\{[\s\S]*\}/);
  if (!block) return null;
  try {
    const parsed = JSON.parse(block[0]);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function detectLanguage(text) {
  return /[\u4e00-\u9fff]/.test(String(text || "")) ? "zh" : "en";
}

module.exports = { Kernel };
