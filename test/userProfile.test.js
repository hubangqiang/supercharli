const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadUserProfile } = require("../src/runtime/userProfile");

function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-profile-test-"));
  const baseFile = path.join(tmpDir, "base.json");
  const userFile = path.join(tmpDir, "user.json");

  fs.writeFileSync(
    baseFile,
    JSON.stringify(
      {
        charliName: "SuperCharli",
        roleDefinition: "长期成长伙伴",
        personalityCore: ["乐观", "长远"],
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    userFile,
    JSON.stringify(
      {
        charliName: "我的查理",
        communicationStyle: "直接",
      },
      null,
      2,
    ),
  );

  const merged = loadUserProfile({
    SUPERCHARLI_BASE_PROFILE_FILE: baseFile,
    SUPERCHARLI_PROFILE_FILE: userFile,
  });

  assert.strictEqual(merged.charliName, "我的查理");
  assert.strictEqual(merged.roleDefinition, "长期成长伙伴");
  assert.strictEqual(merged.communicationStyle, "直接");
  assert.deepStrictEqual(merged.personalityCore, ["乐观", "长远"]);

  const onlyBase = loadUserProfile({
    SUPERCHARLI_BASE_PROFILE_FILE: baseFile,
    SUPERCHARLI_PROFILE_FILE: path.join(tmpDir, "missing.json"),
  });
  assert.strictEqual(onlyBase.charliName, "SuperCharli");

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("user profile tests: PASS");
}

run();
