const crypto = require("crypto");
const { applyPersonaGuard, normalizeResponse } = require("./policies");
const { evaluateResponseQuality, buildQualityRepairFeedback } = require("./responseQuality");
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

    const selectedSkills = await selectSkillsForTurn({
      memory: this.memory,
      router: this.router,
      modelRef: route.model,
      userText: input.text,
      maxSelected: 2,
    });
    this.telemetry.log({
      stage: "skill-route",
      traceId,
      mode: selectedSkills.mode,
      candidateCount: selectedSkills.candidateCount,
      selectedCount: selectedSkills.skills.length,
      reason: selectedSkills.reason || "",
    });

    const learningSnapshot =
      this.learner && typeof this.learner.snapshot === "function" ? this.learner.snapshot() : null;

    const baseGenContext = {
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
      skills: selectedSkills.skills,
      l3,
      l4,
      focusMode,
    };
    const generation = await this.router.generateWithFallback(route.model, baseGenContext);
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

    let finalGenerated = generated;
    let response = normalizeResponse(finalGenerated, severity);
    let quality = evaluateResponseQuality({
      responseText: response.conclusion,
      focusMode,
      inputText: input.text,
    });
    let qualityRetryUsed = false;

    if (
      !quality.pass &&
      augmentationMode === "external-model-augmented" &&
      this.router &&
      typeof this.router.generate === "function"
    ) {
      const repaired = await this.tryQualityRepair({
        routeModel: route.model,
        baseGenContext,
        quality,
        focusMode,
        inputText: input.text,
        severity,
      });
      if (repaired) {
        finalGenerated = repaired.generated;
        response = repaired.response;
        quality = repaired.quality;
        qualityRetryUsed = repaired.retryUsed;
      }
    }
    this.telemetry.log({
      stage: "normalize",
      traceId,
      responseMode: finalGenerated.responseMode || "normal",
      qualityScore: quality.score,
      qualityPass: quality.pass,
      qualityIssues: quality.issues,
      qualityRetryUsed,
    });

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

    const activeLearning = isActiveLearningRequest(input.text);
    const modelLearningSignals =
      activeLearning && this.router && typeof this.router.generate === "function" && augmentationMode === "external-model-augmented"
        ? await extractModelLearningSignals(this.router, route.model, input.text, finalGenerated.content)
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

    if (
      augmentationMode === "external-model-augmented" &&
      this.memory &&
      typeof this.memory.upsertSkill === "function" &&
      shouldExtractSkillAsset(input.text, learning, focusMode)
    ) {
      const extractedSkill = await extractModelSkillAsset(this.router, route.model, input.text, finalGenerated.content);
      if (extractedSkill?.shouldStore && extractedSkill.skillId) {
        this.memory.upsertSkill({
          skillId: extractedSkill.skillId,
          title: extractedSkill.title,
          applicability: extractedSkill.applicability,
          method: extractedSkill.method,
          boundaries: extractedSkill.boundaries,
          confidence: extractedSkill.confidence,
          source: "model-extracted",
          status: "published",
        });
      }
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

    const loadedPacks = Array.isArray(generation.result?.promptMeta?.loadedPacks)
      ? generation.result.promptMeta.loadedPacks
      : [];
    if (this.memory && typeof this.memory.recordPromptSkills === "function") {
      this.memory.recordPromptSkills({
        createdAt: new Date().toISOString(),
        sessionId: input.sessionId,
        traceId,
        route: route.route,
        modelProvider: generation.result.provider,
        modelName: generation.result.model,
        promptTokensUsed: generation.result?.promptMeta?.usedTokens || 0,
        droppedPacks: generation.result?.promptMeta?.droppedPacks || 0,
        skills: loadedPacks,
      });
    }
    if (this.memory && typeof this.memory.recordSkillUsage === "function" && selectedSkills.skills.length) {
      this.memory.recordSkillUsage({
        createdAt: new Date().toISOString(),
        sessionId: input.sessionId,
        traceId,
        route: route.route,
        modelProvider: generation.result.provider,
        modelName: generation.result.model,
        skillIds: selectedSkills.skills.map((x) => x.skillId || x.id).filter(Boolean),
        reason: "inference-time-injection",
        responseScore: quality.score,
        pass: quality.pass,
      });
    }

    return {
      response,
      meta: {
        route: route.route,
        routeReason: route.reason,
        modelProvider: generation.result.provider,
        model: generation.result.model,
        fallbackUsed: Boolean(generation.fallbackUsed),
        fallbackLevel: generation.fallbackLevel || 0,
        responseMode: finalGenerated.responseMode || "normal",
        qualityScore: quality.score,
        qualityPass: quality.pass,
        qualityIssues: quality.issues,
        qualityRetryUsed,
        severity,
        severityReason: severityInfo.reason,
        promotedToL2,
        traceId,
        regenerated: Boolean(finalGenerated.regenerated),
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
        injection: {
          promptTokensUsed: generation.result?.promptMeta?.usedTokens || 0,
          droppedPacks: generation.result?.promptMeta?.droppedPacks || 0,
          loadedPackIds: generation.result?.promptMeta?.loadedPackIds || [],
          loadedSkillCount: loadedPacks.length,
          appliedSkillIds: selectedSkills.skills.map((x) => x.skillId || x.id).filter(Boolean),
          skillRouteMode: selectedSkills.mode,
          skillRouteReason: selectedSkills.reason || "",
        },
      },
    };
  }

  async tryQualityRepair(input = {}) {
    const repairHint = buildQualityRepairFeedback(input.quality, { focusMode: input.focusMode });
    try {
      const retried = await this.router.generate(input.routeModel, {
        ...input.baseGenContext,
        qualityFeedback: repairHint,
      });
      const guard = applyPersonaGuard(retried.content, input.severity);
      const safe = guard.ok
        ? retried
        : await this.router.regenerateSafe(
            retried,
            {
              text: input.inputText,
              l1: input.baseGenContext.l1,
              recalled: input.baseGenContext.recalled,
              severity: input.severity,
              personaProfile: input.baseGenContext.personaProfile,
            },
            guard.reason,
          );
      const response = normalizeResponse(safe, input.severity);
      const quality = evaluateResponseQuality({
        responseText: response.conclusion,
        focusMode: input.focusMode,
        inputText: input.inputText,
      });
      if (quality.score <= Number(input.quality?.score || 0)) {
        return null;
      }
      return {
        generated: { ...safe, responseMode: "quality-repair" },
        response,
        quality,
        retryUsed: true,
      };
    } catch {
      return null;
    }
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

function shouldExtractSkillAsset(text, learning, focusMode) {
  const s = String(text || "").toLowerCase();
  if (focusMode) return true;
  if (learning?.event?.shouldLearn && learning?.event?.signalSource === "model-extracted") return true;
  if (/标准|模板|流程|方法|我教你|规范|checklist|playbook|pattern/i.test(s)) return true;
  return false;
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

async function extractModelSkillAsset(router, modelRef, userText, assistantText) {
  const lang = detectLanguage(userText);
  const isZh = lang === "zh";
  const prompt = [
    isZh ? "你是技能资产提炼器。" : "You are a skill asset extractor.",
    isZh
      ? "基于用户输入和助手回复，提炼一个可复用技能资产（方法而非答案）。"
      : "Given user input and assistant response, extract one reusable skill asset (method, not fixed answer).",
    isZh
      ? "只返回JSON，字段：skillId,title,applicability,method,boundaries,confidence(0-1),shouldStore(boolean)。"
      : "Return JSON only with keys: skillId,title,applicability,method,boundaries,skillType(foundation|domain|meta),scenarioTags(array),injectionBudget(60-480),qualityScore(0-1),confidence(0-1),shouldStore(boolean).",
    isZh
      ? "skillId 用短横线命名。若无可复用技能，shouldStore=false。"
      : "Use kebab-case for skillId. If nothing reusable, set shouldStore=false.",
    "",
    `${isZh ? "用户" : "User"}: ${String(userText || "").slice(0, 1400)}`,
    `${isZh ? "助手" : "Assistant"}: ${String(assistantText || "").slice(0, 1400)}`,
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
    return parseSkillAssetJson(out?.content || "");
  } catch {
    return null;
  }
}

async function selectSkillsForTurn({ memory, router, modelRef, userText, maxSelected = 2 }) {
  const fallback = () => {
    const direct = memory && typeof memory.recallSkills === "function" ? memory.recallSkills(userText, maxSelected) : [];
    return {
      skills: direct,
      mode: "local-fallback",
      candidateCount: direct.length,
      reason: "keyword-recall",
    };
  };
  if (!memory || typeof memory.listSkills !== "function") return fallback();

  const candidates = memory.listSkills(12).filter((x) => x.status === "published" && String(x.lifecycle || "active") === "active");
  if (!candidates.length) return { skills: [], mode: "none", candidateCount: 0, reason: "empty-library" };
  if (!isExternalModelRef(modelRef)) return fallback();
  if (!router || typeof router.generate !== "function") return fallback();

  const prompt = [
    "You are a meta-skill router.",
    "Select up to 2 most relevant skills for current user intent.",
    "Return strict JSON only: { selectedSkillIds: string[], reason: string }.",
    "Prefer high precision and low token overhead.",
    "",
    `User: ${String(userText || "").slice(0, 1200)}`,
    "Candidates:",
    ...candidates.map((c) => {
      const tags = Array.isArray(c.scenarioTags) ? c.scenarioTags.join(",") : "";
      return `- ${c.skillId} | ${c.title} | ${c.skillType || "domain"} | tags=${tags} | quality=${Number(c.qualityScore || 0).toFixed(2)} | confidence=${Number(c.confidence || 0).toFixed(2)}`;
    }),
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
    const parsed = parseMetaSkillRouteJson(out?.content || "");
    if (!parsed) return fallback();
    const selectedIds = new Set(parsed.selectedSkillIds.slice(0, Math.max(1, maxSelected)).map((x) => String(x || "").trim()).filter(Boolean));
    const selected = candidates.filter((x) => selectedIds.has(String(x.skillId || "")));
    if (!selected.length) return fallback();
    return {
      skills: selected.slice(0, Math.max(1, maxSelected)),
      mode: "model-meta-router",
      candidateCount: candidates.length,
      reason: parsed.reason || "",
    };
  } catch {
    return fallback();
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

function parseSkillAssetJson(text) {
  const raw = String(text || "");
  const block = raw.match(/\{[\s\S]*\}/);
  if (!block) return null;
  try {
    const parsed = JSON.parse(block[0]);
    const skillId = sanitizeSkillId(parsed.skillId);
    if (!skillId) return null;
    return {
      skillId,
      title: String(parsed.title || "").trim(),
      applicability: String(parsed.applicability || "").trim(),
      method: String(parsed.method || "").trim(),
      boundaries: String(parsed.boundaries || "").trim(),
      skillType: normalizeSkillType(parsed.skillType),
      scenarioTags: normalizeTags(parsed.scenarioTags),
      injectionBudget: normalizeInjectionBudget(parsed.injectionBudget),
      qualityScore: clamp01(Number(parsed.qualityScore || 0.5)),
      confidence: clamp01(Number(parsed.confidence || 0)),
      shouldStore: Boolean(parsed.shouldStore),
    };
  } catch {
    return null;
  }
}

function sanitizeSkillId(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!s || s.length < 3) return "";
  return s.slice(0, 64);
}

function parseMetaSkillRouteJson(text) {
  const raw = String(text || "");
  const block = raw.match(/\{[\s\S]*\}/);
  if (!block) return null;
  try {
    const parsed = JSON.parse(block[0]);
    return {
      selectedSkillIds: Array.isArray(parsed.selectedSkillIds) ? parsed.selectedSkillIds : [],
      reason: String(parsed.reason || "").trim(),
    };
  } catch {
    return null;
  }
}

function isExternalModelRef(modelRef) {
  const provider = String(modelRef?.provider || "").toLowerCase();
  return provider && provider !== "mock" && provider !== "local";
}

function normalizeSkillType(v) {
  const t = String(v || "domain").toLowerCase();
  if (t === "foundation" || t === "domain" || t === "meta") return t;
  return "domain";
}

function normalizeTags(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 12);
  if (!v) return [];
  return String(v)
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeInjectionBudget(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 180;
  return Math.max(60, Math.min(480, Math.round(n)));
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

module.exports = { Kernel };
