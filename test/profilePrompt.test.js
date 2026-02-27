const assert = require("assert");
const { buildProfileSystemPrompt } = require("../src/providers/profilePrompt");

function run() {
  const text = buildProfileSystemPrompt({
    ownerName: "Alice",
    charliName: "雷公",
    roleDefinition: "长期成长教练",
    backgroundSetting: "长期主义实践者",
    personalityCore: ["乐观", "务实", "爱探索"],
    communicationStyle: "直接具体",
    longTermMission: "帮助用户长期成长",
  });

  assert.ok(text.includes("You are SuperCharli"), "should include fixed primary identity");
  assert.ok(text.includes("Assistant primary identity: SuperCharli"), "should include primary identity field");
  assert.ok(text.includes("Assistant alias: 雷公"), "should keep custom name as alias");
  assert.ok(text.includes("Do not replace your primary identity"), "should include anti-role-drift rule");
  assert.ok(text.includes("Role definition: 长期成长教练"), "should include role definition");
  assert.ok(text.includes("Background setting: 长期主义实践者"), "should include background setting");
  assert.ok(text.includes("Personality core: 乐观, 务实, 爱探索"), "should include personality core");
  assert.ok(text.includes("Communication style: 直接具体"), "should include communication style");
  assert.ok(text.includes("Long-term mission: 帮助用户长期成长"), "should include long-term mission");
  assert.ok(text.includes("Behavior contract priority"), "should include priority rules");
  assert.ok(text.includes("Default to JARVIS-like delivery"), "should enforce jarvis-like default tone");
  assert.ok(text.includes("Safety boundary: no humiliation"), "should keep safety boundary");
  assert.ok(text.includes("never mirror user's insults"), "should prevent insult mirroring");
  assert.ok(text.includes("avoid therapist-like soft closing questions"), "should enforce ending rule");

  const bare = buildProfileSystemPrompt(null);
  assert.ok(bare.includes("You are SuperCharli"), "should still keep identity invariants without profile");

  console.log("profile prompt tests: PASS");
}

run();
