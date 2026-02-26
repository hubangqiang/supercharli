const ORDER = ["normal", "s1", "s2", "s3"];

class SeverityStateMachine {
  constructor(options = {}) {
    this.ttlMs = {
      s1: options.ttlMs?.s1 || 15 * 60 * 1000,
      s2: options.ttlMs?.s2 || 60 * 60 * 1000,
      s3: options.ttlMs?.s3 || 3 * 60 * 60 * 1000,
    };
    this.clock = options.clock || (() => Date.now());
    this.sessions = new Map();
  }

  resolve(input) {
    const sessionId = input.sessionId || "default";
    const observed = this._detect(input);
    const now = this.clock();

    const current = this.sessions.get(sessionId) || { severity: "normal", expiresAt: null };

    if (this._rank(observed) > this._rank(current.severity)) {
      const next = this._escalateTo(observed, now);
      this.sessions.set(sessionId, next);
      return next.severity;
    }

    if (observed === current.severity) {
      const refreshed = this._refresh(current.severity, now);
      this.sessions.set(sessionId, refreshed);
      return refreshed.severity;
    }

    const cooled = this._coolDown(current, observed, now);
    this.sessions.set(sessionId, cooled);
    return cooled.severity;
  }

  getState(sessionId) {
    return this.sessions.get(sessionId) || { severity: "normal", expiresAt: null };
  }

  _coolDown(current, observed, now) {
    if (current.severity === "normal") return current;
    if (current.expiresAt && now < current.expiresAt) return current;

    const oneStep = ORDER[Math.max(0, this._rank(current.severity) - 1)];
    const target = ORDER[Math.max(this._rank(observed), this._rank(oneStep))];
    return this._refresh(target, now);
  }

  _escalateTo(severity, now) {
    return this._refresh(severity, now);
  }

  _refresh(severity, now) {
    if (severity === "normal") {
      return { severity, expiresAt: null };
    }
    return {
      severity,
      expiresAt: now + this.ttlMs[severity],
    };
  }

  _rank(severity) {
    return ORDER.indexOf(severity);
  }

  _detect(input) {
    const signals = input.riskSignals || [];
    const text = String(input.text || "").toLowerCase();

    const hasS3Signal =
      signals.includes("guardrail-risk") || text.includes("不可逆") || text.includes("high-risk");
    if (hasS3Signal) return "s3";

    const hasS2Signal =
      signals.includes("repeated-failure") || text.includes("连续失败") || text.includes("拖延");
    if (hasS2Signal) return "s2";

    const hasS1Signal = signals.includes("stress-rise") || text.includes("焦虑") || text.includes("压力");
    if (hasS1Signal) return "s1";

    return "normal";
  }
}

module.exports = { SeverityStateMachine };
