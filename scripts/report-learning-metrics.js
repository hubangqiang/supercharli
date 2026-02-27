#!/usr/bin/env node
const { getDefaultDbPath } = require("../src/runtime/runtimePaths");
const { SQLiteLearningStore } = require("../src/learning/sqliteLearningStore");

function main() {
  const dbPath = process.env.SUPERCHARLI_DB_PATH || getDefaultDbPath(process.env);
  const scope = process.env.SUPERCHARLI_LEARNING_SCOPE || "daemon-main";
  const windowSize = Number(process.env.SUPERCHARLI_LEARNING_REPORT_WINDOW || 60);
  const store = new SQLiteLearningStore({ dbPath, scope });

  const metrics = store.summarizeRecentOutcomes(windowSize);
  const latestVersion = store.getLatestPolicyVersion();
  const rollout = store.getRolloutState();
  const candidates = store.listCandidates(20);
  const approved = candidates.filter((c) => c.status === "approved").length;
  const pending = candidates.filter((c) => c.status === "pending").length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        dbPath,
        scope,
        windowSize,
        metrics,
        policyVersion: latestVersion?.version || null,
        rollout,
        candidateStats: {
          total: candidates.length,
          approved,
          pending,
        },
      },
      null,
      2,
    ),
  );

  store.close();
}

main();
