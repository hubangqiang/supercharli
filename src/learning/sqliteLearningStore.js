const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

class SQLiteLearningStore {
  constructor(options = {}) {
    if (!options.dbPath) throw new Error("dbPath is required for SQLiteLearningStore");
    fs.mkdirSync(path.dirname(options.dbPath), { recursive: true });
    this.db = new DatabaseSync(options.dbPath);
    this._initSchema();
    this.scope = options.scope || "default";

    this.insertEventStmt = this.db.prepare(`
      INSERT INTO learning_events
      (scope, ts, severity, route, pattern_key, outcome, should_learn, fallback_used, text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.upsertStateStmt = this.db.prepare(`
      INSERT INTO learning_state
      (scope, stage, stats_json, policy_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope) DO UPDATE SET
        stage = excluded.stage,
        stats_json = excluded.stats_json,
        policy_json = excluded.policy_json,
        updated_at = excluded.updated_at
    `);

    this.getStateStmt = this.db.prepare(`
      SELECT stage, stats_json AS statsJson, policy_json AS policyJson, updated_at AS updatedAt
      FROM learning_state
      WHERE scope = ?
    `);

    this.listRecentEventsStmt = this.db.prepare(`
      SELECT ts, severity, route, pattern_key AS patternKey, outcome,
             should_learn AS shouldLearn, fallback_used AS fallbackUsed, text
      FROM learning_events
      WHERE scope = ?
      ORDER BY id DESC
      LIMIT ?
    `);

    this.insertCandidateStmt = this.db.prepare(`
      INSERT INTO learning_candidates
      (scope, created_at, event_json, gate_json, proposed_policy_json, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.listCandidatesStmt = this.db.prepare(`
      SELECT id, created_at AS createdAt, event_json AS eventJson, gate_json AS gateJson,
             proposed_policy_json AS proposedPolicyJson, status
      FROM learning_candidates
      WHERE scope = ?
      ORDER BY id DESC
      LIMIT ?
    `);

    this.insertPolicyVersionStmt = this.db.prepare(`
      INSERT INTO learning_policy_versions
      (scope, version, created_at, policy_json, gate_json, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.getLatestPolicyVersionStmt = this.db.prepare(`
      SELECT version, created_at AS createdAt, policy_json AS policyJson, gate_json AS gateJson, note
      FROM learning_policy_versions
      WHERE scope = ?
      ORDER BY version DESC
      LIMIT 1
    `);
  }

  appendEvent(event = {}) {
    this.insertEventStmt.run(
      this.scope,
      event.ts || new Date().toISOString(),
      event.severity || "normal",
      event.route || "fast",
      event.patternKey || "general-execution-pattern",
      event.outcome || "neutral",
      event.shouldLearn ? 1 : 0,
      event.fallbackUsed ? 1 : 0,
      String(event.text || ""),
    );
  }

  saveState(state = {}) {
    this.upsertStateStmt.run(
      this.scope,
      state.stage || "apprentice",
      JSON.stringify(state.stats || {}),
      JSON.stringify(state.policy || {}),
      new Date().toISOString(),
    );
  }

  loadState() {
    const row = this.getStateStmt.get(this.scope);
    if (!row) return null;
    return {
      stage: row.stage,
      stats: parseJson(row.statsJson, {}),
      policy: parseJson(row.policyJson, {}),
      updatedAt: row.updatedAt,
    };
  }

  listRecentEvents(limit = 100) {
    const rows = this.listRecentEventsStmt.all(this.scope, limit);
    return rows.reverse().map((r) => ({
      ...r,
      shouldLearn: Boolean(r.shouldLearn),
      fallbackUsed: Boolean(r.fallbackUsed),
    }));
  }

  saveCandidate(candidate = {}) {
    this.insertCandidateStmt.run(
      this.scope,
      candidate.createdAt || new Date().toISOString(),
      JSON.stringify(candidate.event || {}),
      JSON.stringify(candidate.gates || {}),
      JSON.stringify(candidate.proposedPolicy || {}),
      candidate.status || "pending",
    );
  }

  listCandidates(limit = 20) {
    return this.listCandidatesStmt.all(this.scope, limit).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      event: parseJson(r.eventJson, {}),
      gates: parseJson(r.gateJson, {}),
      proposedPolicy: parseJson(r.proposedPolicyJson, {}),
      status: r.status,
    }));
  }

  savePolicyVersion(payload = {}) {
    const latest = this.getLatestPolicyVersionStmt.get(this.scope);
    const nextVersion = (latest?.version || 0) + 1;
    this.insertPolicyVersionStmt.run(
      this.scope,
      nextVersion,
      payload.createdAt || new Date().toISOString(),
      JSON.stringify(payload.policy || {}),
      JSON.stringify(payload.gates || {}),
      payload.note || "policy-activation",
    );
    return nextVersion;
  }

  getLatestPolicyVersion() {
    const row = this.getLatestPolicyVersionStmt.get(this.scope);
    if (!row) return null;
    return {
      version: row.version,
      createdAt: row.createdAt,
      policy: parseJson(row.policyJson, {}),
      gates: parseJson(row.gateJson, {}),
      note: row.note,
    };
  }

  summarizeRecentOutcomes(limit = 30) {
    const rows = this.listRecentEvents(limit);
    const total = rows.length;
    const success = rows.filter((r) => r.outcome === "success").length;
    const failure = rows.filter((r) => r.outcome === "failure").length;
    const repeated = rows.filter((r) => r.patternKey && r.patternKey !== "general-execution-pattern").length;
    return {
      total,
      success,
      failure,
      repeated,
      successRate: total ? success / total : 0,
      recurrenceRate: total ? repeated / total : 0,
      failureRate: total ? failure / total : 0,
    };
  }

  close() {
    this.db.close();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        ts TEXT NOT NULL,
        severity TEXT NOT NULL,
        route TEXT NOT NULL,
        pattern_key TEXT NOT NULL,
        outcome TEXT NOT NULL,
        should_learn INTEGER NOT NULL,
        fallback_used INTEGER NOT NULL,
        text TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learning_state (
        scope TEXT PRIMARY KEY,
        stage TEXT NOT NULL,
        stats_json TEXT NOT NULL,
        policy_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_learning_events_scope_ts
      ON learning_events(scope, ts DESC);

      CREATE TABLE IF NOT EXISTS learning_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        created_at TEXT NOT NULL,
        event_json TEXT NOT NULL,
        gate_json TEXT NOT NULL,
        proposed_policy_json TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_learning_candidates_scope_created
      ON learning_candidates(scope, created_at DESC);

      CREATE TABLE IF NOT EXISTS learning_policy_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        policy_json TEXT NOT NULL,
        gate_json TEXT NOT NULL,
        note TEXT NOT NULL,
        UNIQUE(scope, version)
      );
    `);
  }
}

function parseJson(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

module.exports = { SQLiteLearningStore };
