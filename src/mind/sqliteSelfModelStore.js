const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

class SQLiteSelfModelStore {
  constructor(options = {}) {
    if (!options.dbPath) throw new Error("dbPath is required for SQLiteSelfModelStore");
    this.scope = options.scope || "default";
    fs.mkdirSync(path.dirname(options.dbPath), { recursive: true });
    this.db = new DatabaseSync(options.dbPath);
    this._initSchema();

    this.readStmt = this.db.prepare(`
      SELECT model_json AS modelJson, updated_at AS updatedAt
      FROM self_model_state
      WHERE scope = ?
    `);

    this.writeStmt = this.db.prepare(`
      INSERT INTO self_model_state (scope, model_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(scope) DO UPDATE SET
        model_json = excluded.model_json,
        updated_at = excluded.updated_at
    `);

    this.defaultModel = {
      identity: "SuperCharli",
      stage: "apprentice",
      values: ["growth", "agency"],
      boundaries: ["no-humiliation", "no-fabrication"],
      gatePassCount: 0,
      gateFailCount: 0,
      lastPolicyVersion: null,
      lastAuditStatus: "healthy",
      updatedAt: new Date().toISOString(),
    };
  }

  read() {
    const row = this.readStmt.get(this.scope);
    if (!row) return { ...this.defaultModel };
    let parsed;
    try {
      parsed = JSON.parse(row.modelJson);
    } catch {
      parsed = {};
    }
    return { ...this.defaultModel, ...parsed, updatedAt: row.updatedAt || parsed.updatedAt || this.defaultModel.updatedAt };
  }

  write(patch = {}) {
    const current = this.read();
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.writeStmt.run(this.scope, JSON.stringify(next), next.updatedAt);
  }

  close() {
    this.db.close();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS self_model_state (
        scope TEXT PRIMARY KEY,
        model_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
}

module.exports = { SQLiteSelfModelStore };
