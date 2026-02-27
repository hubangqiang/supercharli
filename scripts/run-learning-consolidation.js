#!/usr/bin/env node
const { getDefaultDbPath } = require("../src/runtime/runtimePaths");
const { SQLiteLearningStore } = require("../src/learning/sqliteLearningStore");
const { Learner } = require("../src/learning/learner");
const path = require("path");

function main() {
  const primaryDbPath = process.env.SUPERCHARLI_DB_PATH || getDefaultDbPath(process.env);
  const scope = process.env.SUPERCHARLI_LEARNING_SCOPE || "daemon-main";
  const maxCandidates = Number(process.env.SUPERCHARLI_LEARNING_CONSOLIDATE_MAX || 8);
  const fallbackDbPath = path.join(process.cwd(), "data", "supercharli.db");

  const { store, dbPath } = openStoreWithFallback(primaryDbPath, fallbackDbPath, scope);
  const learner = new Learner({ store });
  const out = learner.runConsolidation(maxCandidates);

  if (Array.isArray(out.candidates)) {
    for (const c of out.candidates) {
      store.saveCandidate({
        createdAt: c.createdAt,
        event: { patternKey: c.patternKey, outcome: "neutral", text: c.reason, shouldLearn: true },
        gates: { pass: false, source: "offline-consolidation" },
        proposedPolicy: {},
        status: "pending",
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scope,
        dbPath,
        consolidatedCandidates: out.candidates?.length || 0,
        summary: out.summary,
      },
      null,
      2,
    ),
  );

  store.close();
}

function openStoreWithFallback(primaryDbPath, fallbackDbPath, scope) {
  try {
    return { store: new SQLiteLearningStore({ dbPath: primaryDbPath, scope }), dbPath: primaryDbPath };
  } catch (err) {
    const readonly = String(err?.message || "").includes("readonly");
    if (!readonly || primaryDbPath === fallbackDbPath) throw err;
    return { store: new SQLiteLearningStore({ dbPath: fallbackDbPath, scope }), dbPath: fallbackDbPath };
  }
}

main();
