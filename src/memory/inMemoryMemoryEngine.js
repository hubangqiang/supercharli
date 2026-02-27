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
    const strength = Math.min(2.5, (Number(current?.strength || 0.6) * 0.7) + (score.score * 0.8));
    const nextStrategy = defaultStrategyForPattern(key);

    if (current && current.strategy !== nextStrategy) {
      this.reconsolidationCandidates.push({
        key,
        proposedSummary: `Candidate update for ${key}`,
        proposedStrategy: nextStrategy,
        confidence: Number(Math.min(0.95, Math.max(0.5, score.score)).toFixed(2)),
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
      confidence: Number(Math.min(0.95, Math.max(0.5, score.score)).toFixed(2)),
      recallCount: Number(current?.recallCount || 0),
      lastRecalledAt: current?.lastRecalledAt || null,
    });
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
}

function clampRecallLimit(limit) {
  return Math.max(3, Math.min(5, Number(limit) || 5));
}

module.exports = { InMemoryMemoryEngine };
