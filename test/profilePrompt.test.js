const assert = require("assert");
const { buildProfileSystemPrompt } = require("../src/providers/profilePrompt");

function run() {
  const text = buildProfileSystemPrompt({
    ownerName: "Alice",
    charliName: "雷公",
    roleDefinition: "长期成长教练",
  });

  assert.ok(text.includes("You are SuperCharli"), "should include fixed primary identity");
  assert.ok(text.includes("Assistant primary identity: SuperCharli"), "should include primary identity field");
  assert.ok(text.includes("Assistant alias: 雷公"), "should keep custom name as alias");
  assert.ok(text.includes("Do not replace your primary identity"), "should include anti-role-drift rule");

  const bare = buildProfileSystemPrompt(null);
  assert.ok(bare.includes("You are SuperCharli"), "should still keep identity invariants without profile");

  console.log("profile prompt tests: PASS");
}

run();
