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
    this.skillLibrary.set(skillId, {
      skillId,
      title: String(skill.title || current.title || ""),
      applicability: String(skill.applicability || current.applicability || ""),
      method: String(skill.method || current.method || ""),
      boundaries: String(skill.boundaries || current.boundaries || ""),
      confidence: Number(skill.confidence ?? current.confidence ?? 0.7),
      source: String(skill.source || current.source || "model-extracted"),
      status: String(skill.status || current.status || "published"),
      createdAt: current.createdAt || now,
      updatedAt: now,
      lastUsedAt: current.lastUsedAt || null,
      useCount: Number(current.useCount || 0),
    });
    return true;
  }

  recallSkills(text, limit = 3) {
    const q = String(text || "").toLowerCase();
    const rows = Array.from(this.skillLibrary.values()).filter((x) => x.status === "published");
    const scored = rows
      .map((x) => {
        const blob = `${x.skillId} ${x.title} ${x.applicability} ${x.method}`.toLowerCase();
        const hit = q && blob.includes(q) ? 1 : 0;
        const overlap = tokenOverlap(blob, q);
        const score = overlap * 1.4 + hit + Number(x.confidence || 0) * 0.3;
        return { ...x, _score: score };
      })
      .sort((a, b) => b._score - a._score || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    return scored.slice(0, Math.max(1, Number(limit) || 3)).map(({ _score, ...x }) => x);
  }

  recordSkillUsage(usage = {}) {
    const ids = Array.isArray(usage.skillIds) ? usage.skillIds : [];
    const createdAt = usage.createdAt || new Date().toISOString();
    for (const id of ids) {
      const skillId = String(id || "").trim();
      if (!skillId) continue;
      const row = this.skillLibrary.get(skillId);
      if (!row) continue;
      row.useCount = Number(row.useCount || 0) + 1;
      row.lastUsedAt = createdAt;
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

function clampRecallLimit(limit) {
  return Math.max(3, Math.min(5, Number(limit) || 5));
}

module.exports = { InMemoryMemoryEngine };
