const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createBundle, restoreBundle } = require("../src/ops/portableBundle");

function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-bundle-test-"));
  const source = path.join(tmp, "source");
  const target = path.join(tmp, "target");
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(target, { recursive: true });

  const sourcePaths = {
    dbPath: path.join(source, "runtime", "memory.db"),
    profilePath: path.join(source, "config", "charli.profile.json"),
    providersPath: path.join(source, "config", "providers.config.json"),
    envPath: path.join(source, "config", "supercharli.env.sh"),
    exportRoot: path.join(source, "exports"),
  };

  fs.mkdirSync(path.dirname(sourcePaths.dbPath), { recursive: true });
  fs.mkdirSync(path.dirname(sourcePaths.profilePath), { recursive: true });
  fs.writeFileSync(sourcePaths.dbPath, "db-content");
  fs.writeFileSync(sourcePaths.profilePath, JSON.stringify({ charliName: "SuperCharli" }, null, 2));
  fs.writeFileSync(sourcePaths.providersPath, JSON.stringify({ providers: [], routes: {} }, null, 2));
  fs.writeFileSync(sourcePaths.envPath, "export X=1\n");

  const out = createBundle({ paths: sourcePaths });
  assert.ok(fs.existsSync(path.join(out.bundleDir, "manifest.json")), "manifest should exist");

  const targetPaths = {
    dbPath: path.join(target, "runtime", "memory.db"),
    profilePath: path.join(target, "config", "charli.profile.json"),
    providersPath: path.join(target, "config", "providers.config.json"),
    envPath: path.join(target, "config", "supercharli.env.sh"),
  };

  const restored = restoreBundle({ bundleDir: out.bundleDir, paths: targetPaths });
  assert.ok(restored.restoredFiles >= 1);
  assert.strictEqual(fs.readFileSync(targetPaths.dbPath, "utf8"), "db-content");

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("portable bundle tests: PASS");
}

run();
