const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

class SQLiteMemoryEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || 3;
    this.recallLimit = options.recallLimit || 5;
    this.l1Limit = options.l1Limit || 20;

    const dbPath = options.dbPath || path.join(process.cwd(), "data", "supercharli.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS l1_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        text TEXT NOT NULL,
        severity TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pattern_counts (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS l2_patterns (
        key TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        strategy TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_l1_session_id ON l1_events(session_id);
    `);

    this.readL1Stmt = this.db.prepare(`
      SELECT text, severity, trace_id AS traceId, created_at AS createdAt
      FROM l1_events
      WHERE session_id = ?
      ORDER BY id DESC
      LIMIT ?
    `);

    this.writeL1Stmt = this.db.prepare(`
      INSERT INTO l1_events (session_id, text, severity, trace_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.trimL1Stmt = this.db.prepare(`
      DELETE FROM l1_events
      WHERE session_id = ?
        AND id NOT IN (
          SELECT id
          FROM l1_events
          WHERE session_id = ?
          ORDER BY id DESC
          LIMIT ?
        )
    `);

    this.readPatternCountStmt = this.db.prepare(`
      SELECT count
      FROM pattern_counts
      WHERE key = ?
    `);

    this.upsertPatternCountStmt = this.db.prepare(`
      INSERT INTO pattern_counts (key, count)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET count = excluded.count
    `);

    this.upsertL2Stmt = this.db.prepare(`
      INSERT INTO l2_patterns (key, summary, strategy, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        summary = excluded.summary,
        strategy = excluded.strategy,
        updated_at = excluded.updated_at
    `);

    this.listL2Stmt = this.db.prepare(`
      SELECT key, summary, strategy, updated_at AS updatedAt
      FROM l2_patterns
      ORDER BY updated_at DESC
    `);
  }

  readL1(sessionId) {
    const rows = this.readL1Stmt.all(sessionId, this.l1Limit);
    return rows.reverse();
  }

  writeL1(sessionId, entry) {
    this.writeL1Stmt.run(sessionId, entry.text, entry.severity, entry.traceId, entry.createdAt);
    this.trimL1Stmt.run(sessionId, sessionId, this.l1Limit);
  }

  recallL2(text) {
    const lower = String(text || "").toLowerCase();
    return this.listL2Stmt
      .all()
      .filter((item) => lower.includes(item.key))
      .slice(0, this.recallLimit);
  }

  evaluatePromotion(entry) {
    const key = this._patternKey(entry.text);
    if (!key) return false;

    const current = this.readPatternCountStmt.get(key);
    const count = (current?.count || 0) + 1;
    this.upsertPatternCountStmt.run(key, count);

    if (count < this.threshold) return false;

    this.upsertL2Stmt.run(
      key,
      `Repeated pattern detected: ${key}`,
      "Break into one objective and one minimal next step.",
      new Date().toISOString(),
    );
    return true;
  }

  close() {
    this.db.close();
  }

  _patternKey(text) {
    const lower = String(text || "").toLowerCase();
    if (lower.includes("焦虑") || lower.includes("anxious")) return "stress-planning";
    if (lower.includes("拖延") || lower.includes("procrast")) return "procrastination-loop";
    if (lower.includes("冲动") || lower.includes("impulsive")) return "high-risk-impulse";
    return "general-execution-pattern";
  }
}

module.exports = { SQLiteMemoryEngine };
