class InMemoryMemoryEngine {
  constructor() {
    this.l1 = new Map();
    this.l2 = new Map();
    this.patternCounts = new Map();
    this.threshold = 3;
  }

  readL1(sessionId) {
    return this.l1.get(sessionId) || [];
  }

  writeL1(sessionId, entry) {
    const current = this.readL1(sessionId);
    current.push(entry);
    this.l1.set(sessionId, current.slice(-20));
  }

  recallL2(text) {
    const lower = text.toLowerCase();
    return Array.from(this.l2.entries())
      .filter(([key]) => lower.includes(key))
      .map(([, value]) => value)
      .slice(0, 5);
  }

  evaluatePromotion(entry) {
    const key = this._patternKey(entry.text);
    if (!key) return false;

    const count = (this.patternCounts.get(key) || 0) + 1;
    this.patternCounts.set(key, count);

    if (count < this.threshold) return false;

    this.l2.set(key, {
      key,
      summary: `Repeated pattern detected: ${key}`,
      strategy: "Break into one objective and one minimal next step.",
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  _patternKey(text) {
    const lower = text.toLowerCase();
    if (lower.includes("焦虑") || lower.includes("anxious")) return "stress-planning";
    if (lower.includes("拖延") || lower.includes("procrast")) return "procrastination-loop";
    if (lower.includes("冲动") || lower.includes("impulsive")) return "high-risk-impulse";
    return "general-execution-pattern";
  }
}

module.exports = { InMemoryMemoryEngine };
