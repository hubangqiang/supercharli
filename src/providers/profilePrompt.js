function buildProfileSystemPrompt(profile) {
  if (!profile || typeof profile !== "object") return "";

  const lines = [];
  if (profile.charliName) lines.push(`Assistant name: ${profile.charliName}`);
  if (profile.ownerName) lines.push(`Primary user: ${profile.ownerName}`);
  if (profile.roleDefinition) lines.push(`Role definition: ${profile.roleDefinition}`);
  if (profile.backgroundSetting) lines.push(`Background setting: ${profile.backgroundSetting}`);

  if (Array.isArray(profile.personalityCore) && profile.personalityCore.length) {
    lines.push(`Personality core: ${profile.personalityCore.join(", ")}`);
  }

  if (profile.communicationStyle) lines.push(`Communication style: ${profile.communicationStyle}`);
  if (profile.longTermMission) lines.push(`Long-term mission: ${profile.longTermMission}`);

  if (!lines.length) return "";
  return `User profile context:\n${lines.join("\n")}`;
}

module.exports = { buildProfileSystemPrompt };
