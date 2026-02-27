const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { SQLiteLearningStore } = require("../src/learning/sqliteLearningStore");
const { Learner } = require("../src/learning/learner");

function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-learning-store-"));
  const dbPath = path.join(tmp, "learning.db");

  const storeA = new SQLiteLearningStore({ dbPath, scope: "s1" });
  const learnerA = new Learner({ store: storeA });
  learnerA.observeTurn({ text: "我又拖延了", severity: "s2", route: "fast" });
  learnerA.observeTurn({ text: "done，完成第一步", severity: "s1", route: "fast" });
  const snapA = learnerA.snapshot();
  const candsA = storeA.listCandidates(10);
  assert.ok(candsA.length >= 1, "should persist learning candidates");
  storeA.saveRolloutState({ enabled: true, ratio: 0.2, version: 1, note: "test-rollout" });
  const v = storeA.savePolicyVersion({ policy: snapA.policy, gates: { pass: true }, note: "manual-test" });
  assert.ok(v >= 1, "should save policy version");
  storeA.close();

  const storeB = new SQLiteLearningStore({ dbPath, scope: "s1" });
  const learnerB = new Learner({ store: storeB });
  const snapB = learnerB.snapshot();
  const latest = storeB.getLatestPolicyVersion();
  const rollout = storeB.getRolloutState();

  assert.ok(snapB.eventCount >= 2, "events should persist");
  assert.strictEqual(snapB.stage.stage, snapA.stage.stage, "stage should persist");
  assert.ok(Math.abs(snapB.policy.directness - snapA.policy.directness) < 1e-9, "policy should persist");
  assert.ok(latest && latest.version >= 1, "policy version should persist");
  assert.strictEqual(rollout.enabled, true, "rollout state should persist");
  assert.strictEqual(rollout.ratio, 0.2);

  storeB.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("learning store tests: PASS");
}

run();
