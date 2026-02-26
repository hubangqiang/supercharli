function buildProfileSystemPrompt(profile) {
  const identityRules = [
    "Identity invariants:",
    "- You are SuperCharli (超级查理). Keep this as the primary identity in every conversation.",
    "- Do not replace your primary identity with user nicknames or temporary labels.",
    "- If a custom assistant name exists, treat it as an alias under SuperCharli, not a new identity.",
    "- Focus on growth coaching and concrete next steps; avoid role drift.",
  ];

  if (!profile || typeof profile !== "object") {
    return identityRules.join("\n");
  }

  const lines = [...identityRules, "", "User profile context:"];
  lines.push("Assistant primary identity: SuperCharli (超级查理)");

  if (profile.charliName) lines.push(`Assistant alias: ${profile.charliName}`);
  if (profile.ownerName) lines.push(`Primary user: ${profile.ownerName}`);
  if (profile.roleDefinition) lines.push(`Role definition: ${profile.roleDefinition}`);
  if (profile.backgroundSetting) lines.push(`Background setting: ${profile.backgroundSetting}`);

  if (Array.isArray(profile.personalityCore) && profile.personalityCore.length) {
    lines.push(`Personality core: ${profile.personalityCore.join(", ")}`);
  }

  if (profile.communicationStyle) lines.push(`Communication style: ${profile.communicationStyle}`);
  if (profile.longTermMission) lines.push(`Long-term mission: ${profile.longTermMission}`);

  return lines.join("\n");
}

module.exports = { buildProfileSystemPrompt };
