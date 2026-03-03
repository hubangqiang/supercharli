const { classifyPatternKey, defaultStrategyForPattern } = require("./patternClassifier");
const { computePromotionScore } = require("./promotionScoring");
const { rankRecalledItems } = require("./recallRanking");

class InMemoryMemoryEngine {
  constructor(options = {}) {
    this.l1 = new Map();
    this.l2 = new Map();
    this.patternCounts = new Map();
    this.threshold = options.threshold || 3;
    this.recallLimit = clampRecallLimit(options.recallLimit || 5);
    this.l1Limit = options.l1Limit || 20;
    this.scoreThreshold = options.scoreThreshold || 0.65;
    this.reconsolidationCandidates = [];
    this.l3 = [];
    this.l4 = {};
    this.promptSkillCatalog = new Map();
    this.promptSkillHistory = [];
    this.skillLibrary = new Map();
    this.skillHistory = [];
    this.skillLifecycleHistory = [];
    this.skillProcessTrace = [];
    this._ensureSystemMetaSkills();
  }

  readL1(sessionId) {
    return this.l1.get(sessionId) || [];
  }

  writeL1(sessionId, entry) {
    const current = this.readL1(sessionId);
    current.push(entry);
    this.l1.set(sessionId, current.slice(-this.l1Limit));
  }

  recallL2(text) {
    const items = Array.from(this.l2.values());
    const matched = items.filter((item) => {
      const q = String(text || "").toLowerCase();
      return q.includes(String(item.key || "").toLowerCase()) || q.includes(String(item.summary || "").toLowerCase());
    });
    const pool = matched.length ? matched : items;
    const ranked = rankRecalledItems(pool, text, this.recallLimit);
    const now = new Date().toISOString();
    for (const item of ranked) {
      const current = this.l2.get(item.key);
      if (!current) continue;
      current.recallCount = (current.recallCount || 0) + 1;
      current.lastRecalledAt = now;
      current.strength = Math.min(2.5, Number(current.strength || 0.6) + 0.05);
      this.l2.set(item.key, current);
    }
    return ranked;
  }

  evaluatePromotion(entry) {
    const key = classifyPatternKey(entry.text);
    if (!key) return false;

    const count = (this.patternCounts.get(key) || 0) + 1;
    this.patternCounts.set(key, count);

    const score = computePromotionScore(entry, {
      repeatCount: count,
      threshold: this.threshold,
      scoreThreshold: this.scoreThreshold,
    });
    if (!score.shouldPromote) return false;

    const now = new Date().toISOString();
    const current = this.l2.get(key);
    const effectiveScore = score.score;
    const strength = Math.min(2.5, (Number(current?.strength || 0.6) * 0.7) + (effectiveScore * 0.8));
    const nextStrategy = defaultStrategyForPattern(key);

    if (current && current.strategy !== nextStrategy) {
      this.reconsolidationCandidates.push({
        key,
        proposedSummary: `Candidate update for ${key}`,
        proposedStrategy: nextStrategy,
        confidence: Number(Math.min(0.95, Math.max(0.5, effectiveScore)).toFixed(2)),
        sourceText: String(entry.text || ""),
        status: "pending",
        createdAt: now,
      });
    }

    this.l2.set(key, {
      key,
      summary: `Repeated pattern detected: ${key}`,
      strategy: current?.strategy || nextStrategy,
      updatedAt: now,
      strength,
      confidence: Number(Math.min(0.95, Math.max(0.5, effectiveScore)).toFixed(2)),
      recallCount: Number(current?.recallCount || 0),
      lastRecalledAt: current?.lastRecalledAt || null,
    });
    return true;
  }

  upsertL2Pattern(pattern = {}) {
    const key = String(pattern.key || "").trim();
    if (!key) return false;
    const now = pattern.updatedAt || new Date().toISOString();
    const current = this.l2.get(key);
    const next = {
      key,
      summary: String(pattern.summary || current?.summary || `Repeated pattern detected: ${key}`),
      strategy: String(pattern.strategy || current?.strategy || defaultStrategyForPattern(key)),
      updatedAt: now,
      strength: Number.isFinite(pattern.strength) ? Number(pattern.strength) : Number(current?.strength || 1.2),
      confidence: Number.isFinite(pattern.confidence) ? Number(pattern.confidence) : Number(current?.confidence || 0.75),
      recallCount: Number(current?.recallCount || 0),
      lastRecalledAt: current?.lastRecalledAt || null,
      source: String(pattern.source || current?.source || "model-extracted"),
    };
    this.l2.set(key, next);
    return true;
  }

  writeL3Milestone(milestone = {}) {
    this.l3.push({
      phase: milestone.phase || "unknown",
      eventSummary: String(milestone.eventSummary || ""),
      lesson: String(milestone.lesson || ""),
      confidence: Number(milestone.confidence || 0.6),
      createdAt: milestone.createdAt || new Date().toISOString(),
    });
    this.l3 = this.l3.slice(-200);
  }

  readL3Milestones(limit = 10) {
    return this.l3.slice(-limit).reverse();
  }

  upsertL4Identity(identity = {}) {
    this.l4 = { ...this.l4, ...identity };
  }

  readL4Identity() {
    return { ...this.l4 };
  }

  recordPromptSkills(event = {}) {
    const skills = Array.isArray(event.skills) ? event.skills : [];
    const createdAt = event.createdAt || new Date().toISOString();
    const loadedSkills = [];
    for (const skill of skills) {
      const skillId = String(skill?.id || "").trim();
      if (!skillId) continue;
      const text = String(skill?.text || "");
      const hash = hashText(text);
      const preview = toPreview(text);
      const current = this.promptSkillCatalog.get(skillId);
      this.promptSkillCatalog.set(skillId, {
        skillId,
        latestHash: hash,
        latestText: text,
        latestPreview: preview,
        firstSeenAt: current?.firstSeenAt || createdAt,
        lastSeenAt: createdAt,
        seenCount: Number(current?.seenCount || 0) + 1,
      });
      loadedSkills.push({
        id: skillId,
        hash,
        preview,
        tokens: Number(skill?.tokens || 0),
      });
    }

    this.promptSkillHistory.push({
      createdAt,
      sessionId: String(event.sessionId || ""),
      traceId: String(event.traceId || ""),
      route: String(event.route || "fast"),
      modelProvider: String(event.modelProvider || ""),
      modelName: String(event.modelName || ""),
      promptTokensUsed: Number(event.promptTokensUsed || 0),
      droppedPacks: Number(event.droppedPacks || 0),
      loadedSkillIds: loadedSkills.map((x) => x.id),
      loadedSkills,
    });
    this.promptSkillHistory = this.promptSkillHistory.slice(-200);
    return true;
  }

  listPromptSkillCatalog(limit = 50) {
    return Array.from(this.promptSkillCatalog.values())
      .sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")))
      .slice(0, Math.max(1, Number(limit) || 50));
  }

  listPromptSkillHistory(limit = 60) {
    return this.promptSkillHistory
      .slice(-Math.max(1, Number(limit) || 60))
      .reverse();
  }

  upsertSkill(skill = {}) {
    const skillId = String(skill.skillId || skill.id || "").trim();
    if (!skillId) return false;
    const now = skill.updatedAt || new Date().toISOString();
    const current = this.skillLibrary.get(skillId) || {};
    const evidenceCount = Number(current.evidenceCount || 0) + (String(skill.source || "model-extracted") === "model-extracted" ? 1 : 0);
    const qualityScore = Number(skill.qualityScore ?? current.qualityScore ?? 0.5);
    const lifecycle = resolveLifecycle({
      existingLifecycle: String(skill.lifecycle || current.lifecycle || "candidate"),
      evidenceCount,
      qualityScore,
    });
    this.skillLibrary.set(skillId, {
      skillId,
      title: String(skill.title || current.title || ""),
      applicability: String(skill.applicability || current.applicability || ""),
      method: String(skill.method || current.method || ""),
      boundaries: String(skill.boundaries || current.boundaries || ""),
      skillType: String(skill.skillType || current.skillType || "domain"),
      scenarioTags: normalizeSkillTags(skill.scenarioTags || skill.tags || current.scenarioTags || []),
      injectionBudget: Math.max(60, Math.min(480, Number(skill.injectionBudget ?? current.injectionBudget ?? 180))),
      version: Math.max(1, Number(skill.version ?? current.version ?? 1)),
      lifecycle,
      qualityScore,
      evidenceCount,
      successCount: Number(skill.successCount ?? current.successCount ?? 0),
      failCount: Number(skill.failCount ?? current.failCount ?? 0),
      confidence: Number(skill.confidence ?? current.confidence ?? 0.7),
      source: String(skill.source || current.source || "model-extracted"),
      status: String(skill.status || current.status || "published"),
      createdAt: current.createdAt || now,
      updatedAt: now,
      lastUsedAt: current.lastUsedAt || null,
      useCount: Number(current.useCount || 0),
    });
    if (current.lifecycle && current.lifecycle !== lifecycle) {
      this.skillLifecycleHistory.push({
        createdAt: now,
        skillId,
        fromState: current.lifecycle,
        toState: lifecycle,
        reason: "auto-gate-transition",
      });
      this.skillLifecycleHistory = this.skillLifecycleHistory.slice(-300);
    }
    return true;
  }

  recallSkills(text, limit = 3) {
    const q = String(text || "").toLowerCase();
    if (!q) return [];
    const rows = Array.from(this.skillLibrary.values()).filter((x) => x.status === "published" && x.lifecycle === "active");
    const scored = rows
      .map((x) => {
        const tagBlob = Array.isArray(x.scenarioTags) ? x.scenarioTags.join(" ") : "";
        const blob = `${x.skillId} ${x.title} ${x.applicability} ${x.method} ${tagBlob}`.toLowerCase();
        const hit = q && blob.includes(q) ? 1 : 0;
        const overlap = tokenOverlap(blob, q);
        const score = overlap * 1.4 + hit + Number(x.confidence || 0) * 0.3 + Number(x.qualityScore || 0) * 0.6;
        return { ...x, _score: score };
      })
      .sort((a, b) => b._score - a._score || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    return scored.slice(0, Math.max(1, Number(limit) || 3)).map(({ _score, ...x }) => ({ ...x, relevanceScore: _score }));
  }

  recordSkillUsage(usage = {}) {
    const ids = Array.isArray(usage.skillIds) ? usage.skillIds : [];
    const createdAt = usage.createdAt || new Date().toISOString();
    const responseScore = Number.isFinite(Number(usage.responseScore)) ? Number(usage.responseScore) : 0.5;
    const pass = usage.pass === true;
    const fail = usage.pass === false;
    for (const id of ids) {
      const skillId = String(id || "").trim();
      if (!skillId) continue;
      const row = this.skillLibrary.get(skillId);
      if (!row) continue;
      row.useCount = Number(row.useCount || 0) + 1;
      row.lastUsedAt = createdAt;
      row.successCount = Number(row.successCount || 0) + (pass ? 1 : 0);
      row.failCount = Number(row.failCount || 0) + (fail ? 1 : 0);
      row.qualityScore = Math.max(0, Math.min(1, (Number(row.qualityScore || 0.5) * 0.85) + (responseScore * 0.15)));
      const beforeLifecycle = row.lifecycle;
      if (row.lifecycle === "shadow" && row.useCount >= 3 && row.successCount >= 2 && row.qualityScore >= 0.66) {
        row.lifecycle = "active";
      } else if (row.lifecycle === "active" && row.useCount >= 5 && row.failCount >= 3 && row.qualityScore < 0.42) {
        row.lifecycle = "shadow";
      }
      if (beforeLifecycle !== row.lifecycle) {
        this.skillLifecycleHistory.push({
          createdAt,
          skillId,
          fromState: beforeLifecycle,
          toState: row.lifecycle,
          reason: "usage-quality-transition",
        });
        this.skillLifecycleHistory = this.skillLifecycleHistory.slice(-300);
      }
      this.skillLibrary.set(skillId, row);
    }
    this.skillHistory.push({
      createdAt,
      sessionId: String(usage.sessionId || ""),
      traceId: String(usage.traceId || ""),
      modelProvider: String(usage.modelProvider || ""),
      modelName: String(usage.modelName || ""),
      route: String(usage.route || "fast"),
      skillIds: ids.map((x) => String(x || "")).filter(Boolean),
      reason: String(usage.reason || "inference-time-injection"),
    });
    this.skillHistory = this.skillHistory.slice(-300);
    return true;
  }

  listSkills(limit = 50) {
    return Array.from(this.skillLibrary.values())
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, Math.max(1, Number(limit) || 50));
  }

  listSkillHistory(limit = 60) {
    return this.skillHistory.slice(-Math.max(1, Number(limit) || 60)).reverse();
  }

  listSkillLifecycleHistory(limit = 60) {
    return this.skillLifecycleHistory.slice(-Math.max(1, Number(limit) || 60)).reverse();
  }

  recordSkillProcessEvent(event = {}) {
    this.skillProcessTrace.push({
      createdAt: String(event.createdAt || new Date().toISOString()),
      sessionId: String(event.sessionId || ""),
      traceId: String(event.traceId || ""),
      phase: String(event.phase || "unknown"),
      route: String(event.route || ""),
      modelProvider: String(event.modelProvider || ""),
      modelName: String(event.modelName || ""),
      data: event.data && typeof event.data === "object" ? event.data : {},
    });
    this.skillProcessTrace = this.skillProcessTrace.slice(-400);
    return true;
  }

  listSkillProcessTrace(limit = 120) {
    return this.skillProcessTrace.slice(-Math.max(1, Number(limit) || 120)).reverse();
  }

  _ensureSystemMetaSkills() {
    const now = new Date().toISOString();
    for (const seed of getSystemMetaSkillSeeds()) {
      this.upsertSkill({
        ...seed,
        source: "system-default",
        status: "published",
        lifecycle: "active",
        version: 1,
        confidence: 0.95,
        qualityScore: 0.9,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

function hashText(text) {
  const s = String(text || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return `fnv1a-${(h >>> 0).toString(16)}`;
}

function toPreview(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function tokenOverlap(blob, query) {
  if (!blob || !query) return 0;
  const q = new Set(String(query).split(/[\s,，。.!?;；:：\-_/]+/).filter((x) => x.length >= 2));
  if (!q.size) return 0;
  let hit = 0;
  for (const token of q) {
    if (blob.includes(token)) hit += 1;
  }
  return hit / q.size;
}

function normalizeSkillTags(input) {
  if (Array.isArray(input)) {
    return input.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 12);
  }
  if (!input) return [];
  return String(input)
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function resolveLifecycle(input = {}) {
  const current = String(input.existingLifecycle || "candidate");
  const evidence = Number(input.evidenceCount || 0);
  const quality = Number(input.qualityScore || 0);
  if (current === "active" || current === "deprecated" || current === "archived") return current;
  if (current === "shadow") {
    if (quality >= 0.66 && evidence >= 3) return "active";
    return "shadow";
  }
  if (current === "candidate") {
    if (quality >= 0.55 && evidence >= 2) return "shadow";
    return "candidate";
  }
  return "candidate";
}

function clampRecallLimit(limit) {
  return Math.max(3, Math.min(5, Number(limit) || 5));
}

function getSystemMetaSkillSeeds() {
  return [
    {
      skillId: "skill-extractor",
      title: "技能提炼器",
      skillType: "meta",
      applicability: "当用户在对话中教授方法、规范、步骤、判定标准时，提炼为可复用技能。",
      method: "识别教学信号；抽取目标/触发条件/执行方法/边界；生成候选并等待后续证据强化。",
      boundaries: "不暴露内部提炼过程；不替代模型推理；不得编造用户未表达的规则。",
      scenarioTags: ["learning", "method-extraction", "governance"],
      injectionBudget: 180,
    },
    {
      skillId: "skill-router",
      title: "技能路由器",
      skillType: "meta",
      applicability: "每轮推理前后根据任务意图选择加载/卸载技能并控制注入预算。",
      method: "结合意图、场景标签与相关度分数选择技能；优先核心与高相关技能；按预算裁剪。",
      boundaries: "不对用户显式暴露路由细节；不固定输出格式；避免过量注入导致上下文污染。",
      scenarioTags: ["routing", "injection", "budget-control"],
      injectionBudget: 180,
    },
  ];
}

module.exports = { InMemoryMemoryEngine };
