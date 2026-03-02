const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { getDefaultDbPath } = require("../runtime/runtimePaths");
const { classifyPatternKey, defaultStrategyForPattern } = require("./patternClassifier");
const { computePromotionScore } = require("./promotionScoring");
const { rankRecalledItems } = require("./recallRanking");

class SQLiteMemoryEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || 3;
    this.scoreThreshold = options.scoreThreshold || 0.65;
    this.recallLimit = Math.max(3, Math.min(5, Number(options.recallLimit || 5)));
    this.l1Limit = options.l1Limit || 20;
    this.decayPerDay = options.decayPerDay || 0.02;
    this.decayIntervalWrites = options.decayIntervalWrites || 10;
    this._writeCount = 0;

    const dbPath = options.dbPath || getDefaultDbPath(options.env || process.env);
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
        updated_at TEXT NOT NULL,
        strength REAL NOT NULL DEFAULT 0.6,
        confidence REAL NOT NULL DEFAULT 0.6,
        recall_count INTEGER NOT NULL DEFAULT 0,
        last_recalled_at TEXT,
        source TEXT NOT NULL DEFAULT 'promotion-score'
      );

      CREATE TABLE IF NOT EXISTS memory_reconsolidation_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        proposed_summary TEXT NOT NULL,
        proposed_strategy TEXT NOT NULL,
        confidence REAL NOT NULL,
        source_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS l3_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase TEXT NOT NULL,
        event_summary TEXT NOT NULL,
        lesson TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.6,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS l4_identity (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_l1_session_id ON l1_events(session_id);

      CREATE TABLE IF NOT EXISTS prompt_skill_catalog (
        skill_id TEXT PRIMARY KEY,
        latest_hash TEXT NOT NULL,
        latest_text TEXT NOT NULL,
        latest_preview TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        seen_count INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS prompt_skill_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        route TEXT NOT NULL,
        model_provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        prompt_tokens_used INTEGER NOT NULL DEFAULT 0,
        dropped_packs INTEGER NOT NULL DEFAULT 0,
        loaded_skill_ids_json TEXT NOT NULL,
        loaded_skills_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS skill_library (
        skill_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        applicability TEXT NOT NULL,
        method TEXT NOT NULL,
        boundaries TEXT NOT NULL,
        skill_type TEXT NOT NULL DEFAULT 'domain',
        scenario_tags_json TEXT NOT NULL DEFAULT '[]',
        injection_budget INTEGER NOT NULL DEFAULT 180,
        version INTEGER NOT NULL DEFAULT 1,
        lifecycle TEXT NOT NULL DEFAULT 'active',
        quality_score REAL NOT NULL DEFAULT 0.5,
        success_count INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        confidence REAL NOT NULL DEFAULT 0.7,
        source TEXT NOT NULL DEFAULT 'model-extracted',
        status TEXT NOT NULL DEFAULT 'published',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_used_at TEXT,
        use_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS skill_usage_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        route TEXT NOT NULL,
        model_provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        skill_ids_json TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this._ensureL2Columns();
    this._ensureSkillColumns();
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_l2_updated_at ON l2_patterns(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_l2_strength ON l2_patterns(strength DESC, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recon_candidates_status_created
      ON memory_reconsolidation_candidates(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_l3_created_at ON l3_timeline(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prompt_skill_history_created ON prompt_skill_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prompt_skill_history_session ON prompt_skill_history(session_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_skill_library_status_updated ON skill_library(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_skill_usage_created ON skill_usage_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_skill_usage_session ON skill_usage_history(session_id, created_at DESC);
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

    this.insertL2Stmt = this.db.prepare(`
      INSERT INTO l2_patterns (key, summary, strategy, updated_at, strength, confidence, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO NOTHING
    `);

    this.refreshL2SignalStmt = this.db.prepare(`
      UPDATE l2_patterns
      SET updated_at = ?,
          strength = ?,
          confidence = ?,
          source = ?
      WHERE key = ?
    `);

    this.insertReconCandidateStmt = this.db.prepare(`
      INSERT INTO memory_reconsolidation_candidates
      (key, proposed_summary, proposed_strategy, confidence, source_text, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `);

    this.findL2CandidatesStmt = this.db.prepare(`
      SELECT key, summary, strategy, updated_at AS updatedAt, strength, confidence,
             recall_count AS recallCount, last_recalled_at AS lastRecalledAt, source
      FROM l2_patterns
      WHERE instr(LOWER(?), LOWER(key)) > 0
         OR instr(LOWER(?), LOWER(summary)) > 0
      ORDER BY strength DESC, updated_at DESC
      LIMIT ?
    `);

    this.listL2FallbackStmt = this.db.prepare(`
      SELECT key, summary, strategy, updated_at AS updatedAt, strength, confidence,
             recall_count AS recallCount, last_recalled_at AS lastRecalledAt, source
      FROM l2_patterns
      ORDER BY strength DESC, updated_at DESC
      LIMIT ?
    `);

    this.bumpRecallStmt = this.db.prepare(`
      UPDATE l2_patterns
      SET recall_count = recall_count + 1,
          last_recalled_at = ?,
          strength = MIN(2.5, strength + 0.05)
      WHERE key = ?
    `);

    this.getL2ByKeyStmt = this.db.prepare(`
      SELECT key, summary, strategy, updated_at AS updatedAt, strength, confidence,
             recall_count AS recallCount, last_recalled_at AS lastRecalledAt, source
      FROM l2_patterns
      WHERE key = ?
    `);

    this.applyDecayStmt = this.db.prepare(`
      UPDATE l2_patterns
      SET strength = MAX(0.1, strength - (? * MAX(0, julianday('now') - julianday(updated_at))))
      WHERE updated_at IS NOT NULL
    `);

    this.insertL3Stmt = this.db.prepare(`
      INSERT INTO l3_timeline (phase, event_summary, lesson, confidence, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.readL3Stmt = this.db.prepare(`
      SELECT phase, event_summary AS eventSummary, lesson, confidence, created_at AS createdAt
      FROM l3_timeline
      ORDER BY created_at DESC
      LIMIT ?
    `);

    this.upsertL4Stmt = this.db.prepare(`
      INSERT INTO l4_identity (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    this.readL4Stmt = this.db.prepare(`
      SELECT key, value, updated_at AS updatedAt
      FROM l4_identity
      ORDER BY key ASC
    `);

    this.upsertPromptSkillCatalogStmt = this.db.prepare(`
      INSERT INTO prompt_skill_catalog
      (skill_id, latest_hash, latest_text, latest_preview, first_seen_at, last_seen_at, seen_count)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(skill_id) DO UPDATE SET
        latest_hash = excluded.latest_hash,
        latest_text = excluded.latest_text,
        latest_preview = excluded.latest_preview,
        last_seen_at = excluded.last_seen_at,
        seen_count = prompt_skill_catalog.seen_count + 1
    `);

    this.insertPromptSkillHistoryStmt = this.db.prepare(`
      INSERT INTO prompt_skill_history
      (session_id, trace_id, route, model_provider, model_name, prompt_tokens_used, dropped_packs,
       loaded_skill_ids_json, loaded_skills_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.listPromptSkillCatalogStmt = this.db.prepare(`
      SELECT skill_id AS skillId, latest_hash AS latestHash, latest_preview AS latestPreview,
             first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt, seen_count AS seenCount
      FROM prompt_skill_catalog
      ORDER BY last_seen_at DESC
      LIMIT ?
    `);

    this.listPromptSkillHistoryStmt = this.db.prepare(`
      SELECT created_at AS createdAt, session_id AS sessionId, trace_id AS traceId, route,
             model_provider AS modelProvider, model_name AS modelName,
             prompt_tokens_used AS promptTokensUsed, dropped_packs AS droppedPacks,
             loaded_skill_ids_json AS loadedSkillIdsJson, loaded_skills_json AS loadedSkillsJson
      FROM prompt_skill_history
      ORDER BY id DESC
      LIMIT ?
    `);

    this.upsertSkillStmt = this.db.prepare(`
      INSERT INTO skill_library
      (skill_id, title, applicability, method, boundaries, skill_type, scenario_tags_json, injection_budget, version, lifecycle,
       quality_score, confidence, source, status, created_at, updated_at, last_used_at, use_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)
      ON CONFLICT(skill_id) DO UPDATE SET
        title = excluded.title,
        applicability = excluded.applicability,
        method = excluded.method,
        boundaries = excluded.boundaries,
        skill_type = excluded.skill_type,
        scenario_tags_json = excluded.scenario_tags_json,
        injection_budget = excluded.injection_budget,
        version = excluded.version,
        lifecycle = excluded.lifecycle,
        quality_score = excluded.quality_score,
        confidence = excluded.confidence,
        source = excluded.source,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    this.findSkillsStmt = this.db.prepare(`
      SELECT skill_id AS skillId, title, applicability, method, boundaries, skill_type AS skillType,
             scenario_tags_json AS scenarioTagsJson, injection_budget AS injectionBudget, version, lifecycle,
             quality_score AS qualityScore, success_count AS successCount, fail_count AS failCount,
             confidence, source, status, created_at AS createdAt, updated_at AS updatedAt,
             last_used_at AS lastUsedAt, use_count AS useCount,
             (
               CASE WHEN instr(LOWER(skill_id), LOWER(?)) > 0 THEN 2 ELSE 0 END +
               CASE WHEN instr(LOWER(title), LOWER(?)) > 0 THEN 2 ELSE 0 END +
               CASE WHEN instr(LOWER(applicability), LOWER(?)) > 0 THEN 1 ELSE 0 END +
               CASE WHEN instr(LOWER(method), LOWER(?)) > 0 THEN 1 ELSE 0 END +
               confidence +
               quality_score * 0.6
             ) AS score
      FROM skill_library
      WHERE status = 'published' AND lifecycle = 'active'
      ORDER BY score DESC, updated_at DESC
      LIMIT ?
    `);

    this.listSkillsStmt = this.db.prepare(`
      SELECT skill_id AS skillId, title, applicability, method, boundaries, skill_type AS skillType,
             scenario_tags_json AS scenarioTagsJson, injection_budget AS injectionBudget, version, lifecycle,
             quality_score AS qualityScore, success_count AS successCount, fail_count AS failCount,
             confidence, source, status, created_at AS createdAt, updated_at AS updatedAt,
             last_used_at AS lastUsedAt, use_count AS useCount
      FROM skill_library
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    this.touchSkillUsageStmt = this.db.prepare(`
      UPDATE skill_library
      SET use_count = use_count + 1,
          last_used_at = ?,
          updated_at = ?,
          success_count = success_count + ?,
          fail_count = fail_count + ?,
          quality_score = MAX(0, MIN(1, (quality_score * 0.85) + (? * 0.15))),
          lifecycle = CASE
            WHEN lifecycle = 'active'
              AND (fail_count + ?) >= 3
              AND (use_count + 1) >= 5
              AND ((quality_score * 0.85) + (? * 0.15)) < 0.42
            THEN 'shadow'
            ELSE lifecycle
          END
      WHERE skill_id = ?
    `);

    this.insertSkillUsageStmt = this.db.prepare(`
      INSERT INTO skill_usage_history
      (session_id, trace_id, route, model_provider, model_name, skill_ids_json, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.listSkillHistoryStmt = this.db.prepare(`
      SELECT created_at AS createdAt, session_id AS sessionId, trace_id AS traceId, route,
             model_provider AS modelProvider, model_name AS modelName,
             skill_ids_json AS skillIdsJson, reason
      FROM skill_usage_history
      ORDER BY id DESC
      LIMIT ?
    `);
  }

  readL1(sessionId) {
    const rows = this.readL1Stmt.all(sessionId, this.l1Limit);
    return rows.reverse();
  }

  writeL1(sessionId, entry) {
    this.writeL1Stmt.run(sessionId, entry.text, entry.severity, entry.traceId, entry.createdAt);
    this.trimL1Stmt.run(sessionId, sessionId, this.l1Limit);
    this._writeCount += 1;
    if (this._writeCount % this.decayIntervalWrites === 0) {
      this.applyMemoryDecay();
    }
  }

  recallL2(text) {
    const query = String(text || "");
    const primary = this.findL2CandidatesStmt.all(query, query, this.recallLimit * 2);
    const pool = primary.length ? primary : this.listL2FallbackStmt.all(this.recallLimit * 2);
    const ranked = rankRecalledItems(pool, query, this.recallLimit);
    const now = new Date().toISOString();
    for (const item of ranked) {
      this.bumpRecallStmt.run(now, item.key);
    }
    return ranked;
  }

  evaluatePromotion(entry) {
    const key = classifyPatternKey(entry.text);
    if (!key) return false;

    const current = this.readPatternCountStmt.get(key);
    const count = (current?.count || 0) + 1;
    this.upsertPatternCountStmt.run(key, count);

    const decision = computePromotionScore(entry, {
      repeatCount: count,
      threshold: this.threshold,
      scoreThreshold: this.scoreThreshold,
    });
    if (!decision.shouldPromote) return false;

    const now = new Date().toISOString();
    const existing = this.getL2ByKeyStmt.get(key);
    const currentStrength = Number(existing?.strength || 0.6);
    const effectiveScore = decision.score;
    const nextStrength = Math.min(2.5, (currentStrength * 0.7) + (effectiveScore * 0.8));
    const confidence = Number(Math.min(0.95, Math.max(0.5, effectiveScore)).toFixed(2));
    const nextSummary = `Repeated pattern detected: ${key}`;
    const nextStrategy = defaultStrategyForPattern(key);

    this.insertL2Stmt.run(key, nextSummary, nextStrategy, now, nextStrength, confidence, "promotion-score");
    const active = this.getL2ByKeyStmt.get(key);
    if (active?.key) {
      this.refreshL2SignalStmt.run(now, nextStrength, confidence, "promotion-score", key);
      if (active.strategy !== nextStrategy || active.summary !== nextSummary) {
        this.insertReconCandidateStmt.run(
          key,
          nextSummary,
          nextStrategy,
          confidence,
          String(entry.text || ""),
          now,
        );
      }
    }
    return true;
  }

  upsertL2Pattern(pattern = {}) {
    const key = String(pattern.key || "").trim();
    if (!key) return false;

    const now = pattern.updatedAt || new Date().toISOString();
    const existing = this.getL2ByKeyStmt.get(key);
    const summary = String(pattern.summary || existing?.summary || `Repeated pattern detected: ${key}`);
    const strategy = String(pattern.strategy || existing?.strategy || defaultStrategyForPattern(key));
    const confidence = Number(
      Math.min(0.99, Math.max(0.5, Number.isFinite(pattern.confidence) ? Number(pattern.confidence) : Number(existing?.confidence || 0.75))).toFixed(2),
    );
    const strength = Math.min(
      2.5,
      Math.max(0.6, Number.isFinite(pattern.strength) ? Number(pattern.strength) : Number(existing?.strength || 1.2)),
    );
    const source = String(pattern.source || existing?.source || "model-extracted");

    this.insertL2Stmt.run(key, summary, strategy, now, strength, confidence, source);
    this.refreshL2SignalStmt.run(now, strength, confidence, source, key);
    return true;
  }

  applyMemoryDecay() {
    this.applyDecayStmt.run(this.decayPerDay);
  }

  writeL3Milestone(milestone = {}) {
    this.insertL3Stmt.run(
      milestone.phase || "unknown",
      String(milestone.eventSummary || ""),
      String(milestone.lesson || ""),
      Number(milestone.confidence || 0.6),
      milestone.createdAt || new Date().toISOString(),
    );
  }

  readL3Milestones(limit = 10) {
    return this.readL3Stmt.all(limit);
  }

  upsertL4Identity(identity = {}) {
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(identity)) {
      this.upsertL4Stmt.run(key, JSON.stringify(value), now);
    }
  }

  readL4Identity() {
    const rows = this.readL4Stmt.all();
    const out = {};
    for (const row of rows) {
      try {
        out[row.key] = JSON.parse(row.value);
      } catch {
        out[row.key] = row.value;
      }
    }
    return out;
  }

  recordPromptSkills(event = {}) {
    const createdAt = event.createdAt || new Date().toISOString();
    const rawSkills = Array.isArray(event.skills) ? event.skills : [];
    const loadedSkills = [];
    const seen = new Set();

    for (const skill of rawSkills) {
      const skillId = String(skill?.id || "").trim();
      if (!skillId || seen.has(skillId)) continue;
      seen.add(skillId);

      const text = String(skill?.text || "");
      const hash = sha256(text);
      const preview = toPreview(text);
      const tokens = Number(skill?.tokens || 0);

      this.upsertPromptSkillCatalogStmt.run(
        skillId,
        hash,
        text,
        preview,
        createdAt,
        createdAt,
      );
      loadedSkills.push({ id: skillId, hash, preview, tokens });
    }

    this.insertPromptSkillHistoryStmt.run(
      String(event.sessionId || ""),
      String(event.traceId || ""),
      String(event.route || "fast"),
      String(event.modelProvider || ""),
      String(event.modelName || ""),
      Number(event.promptTokensUsed || 0),
      Number(event.droppedPacks || 0),
      JSON.stringify(loadedSkills.map((x) => x.id)),
      JSON.stringify(loadedSkills),
      createdAt,
    );
    return true;
  }

  listPromptSkillCatalog(limit = 50) {
    return this.listPromptSkillCatalogStmt.all(Math.max(1, Number(limit) || 50));
  }

  listPromptSkillHistory(limit = 60) {
    const rows = this.listPromptSkillHistoryStmt.all(Math.max(1, Number(limit) || 60));
    return rows.map((row) => ({
      ...row,
      loadedSkillIds: parseJson(row.loadedSkillIdsJson, []),
      loadedSkills: parseJson(row.loadedSkillsJson, []),
    }));
  }

  upsertSkill(skill = {}) {
    const skillId = String(skill.skillId || skill.id || "").trim();
    if (!skillId) return false;
    const now = skill.updatedAt || new Date().toISOString();
    const tags = normalizeSkillTags(skill.scenarioTags || skill.tags);
    this.upsertSkillStmt.run(
      skillId,
      String(skill.title || ""),
      String(skill.applicability || ""),
      String(skill.method || ""),
      String(skill.boundaries || ""),
      String(skill.skillType || "domain"),
      JSON.stringify(tags),
      Math.max(60, Math.min(480, Number(skill.injectionBudget || 180))),
      Math.max(1, Number(skill.version || 1)),
      String(skill.lifecycle || "active"),
      Number.isFinite(Number(skill.qualityScore)) ? Number(skill.qualityScore) : 0.5,
      Number.isFinite(Number(skill.confidence)) ? Number(skill.confidence) : 0.7,
      String(skill.source || "model-extracted"),
      String(skill.status || "published"),
      String(skill.createdAt || now),
      now,
    );
    return true;
  }

  recallSkills(text, limit = 3) {
    const q = String(text || "").trim();
    const out = !q
      ? this.listSkills(Math.max(1, Number(limit) || 3)).slice(0, Math.max(1, Number(limit) || 3))
      : this.findSkillsStmt.all(q, q, q, q, Math.max(1, Number(limit) || 3));
    return out.map((row) => ({
      ...row,
      scenarioTags: parseJson(row.scenarioTagsJson, []),
    }));
  }

  recordSkillUsage(usage = {}) {
    const createdAt = usage.createdAt || new Date().toISOString();
    const ids = Array.isArray(usage.skillIds) ? usage.skillIds.map((x) => String(x || "").trim()).filter(Boolean) : [];
    const passInc = usage.pass === true ? 1 : 0;
    const failInc = usage.pass === false ? 1 : 0;
    const responseScore = Number.isFinite(Number(usage.responseScore)) ? Number(usage.responseScore) : 0.5;
    for (const skillId of ids) {
      this.touchSkillUsageStmt.run(
        createdAt,
        createdAt,
        passInc,
        failInc,
        responseScore,
        failInc,
        responseScore,
        skillId,
      );
    }
    this.insertSkillUsageStmt.run(
      String(usage.sessionId || ""),
      String(usage.traceId || ""),
      String(usage.route || "fast"),
      String(usage.modelProvider || ""),
      String(usage.modelName || ""),
      JSON.stringify(ids),
      String(usage.reason || "inference-time-injection"),
      createdAt,
    );
    return true;
  }

  listSkills(limit = 50) {
    return this.listSkillsStmt.all(Math.max(1, Number(limit) || 50)).map((row) => ({
      ...row,
      scenarioTags: parseJson(row.scenarioTagsJson, []),
    }));
  }

  listSkillHistory(limit = 60) {
    return this.listSkillHistoryStmt.all(Math.max(1, Number(limit) || 60)).map((row) => ({
      ...row,
      skillIds: parseJson(row.skillIdsJson, []),
    }));
  }

  close() {
    this.db.close();
  }

  _ensureL2Columns() {
    const columns = new Set(this.db.prepare("PRAGMA table_info(l2_patterns)").all().map((c) => c.name));
    const add = (name, sql) => {
      if (!columns.has(name)) this.db.exec(`ALTER TABLE l2_patterns ADD COLUMN ${sql}`);
    };

    add("strength", "strength REAL NOT NULL DEFAULT 0.6");
    add("confidence", "confidence REAL NOT NULL DEFAULT 0.6");
    add("recall_count", "recall_count INTEGER NOT NULL DEFAULT 0");
    add("last_recalled_at", "last_recalled_at TEXT");
    add("source", "source TEXT NOT NULL DEFAULT 'promotion-score'");
  }

  _ensureSkillColumns() {
    const columns = new Set(this.db.prepare("PRAGMA table_info(skill_library)").all().map((c) => c.name));
    const add = (name, sql) => {
      if (!columns.has(name)) this.db.exec(`ALTER TABLE skill_library ADD COLUMN ${sql}`);
    };

    add("skill_type", "skill_type TEXT NOT NULL DEFAULT 'domain'");
    add("scenario_tags_json", "scenario_tags_json TEXT NOT NULL DEFAULT '[]'");
    add("injection_budget", "injection_budget INTEGER NOT NULL DEFAULT 180");
    add("version", "version INTEGER NOT NULL DEFAULT 1");
    add("lifecycle", "lifecycle TEXT NOT NULL DEFAULT 'active'");
    add("quality_score", "quality_score REAL NOT NULL DEFAULT 0.5");
    add("success_count", "success_count INTEGER NOT NULL DEFAULT 0");
    add("fail_count", "fail_count INTEGER NOT NULL DEFAULT 0");
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

function toPreview(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function parseJson(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
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

module.exports = { SQLiteMemoryEngine };
