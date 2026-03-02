function planPromptPacks(context = {}) {
  const severity = context.severity || "normal";
  const complex = context.complexity === "deep";
  const hasMemory = (Array.isArray(context.l1) && context.l1.length > 0) || (Array.isArray(context.recalled) && context.recalled.length > 0);
  const hasSkills = Array.isArray(context.skills) && context.skills.length > 0;
  const hasQualityFeedback = Boolean(String(context.qualityFeedback || "").trim());
  const needFullPersona = complex || severity === "s3";
  const needStyleFull = complex || severity === "s3";
  const needRiskPack = severity === "s2" || severity === "s3";

  const packIds = ["core-constraints", needFullPersona ? "persona-full" : "persona-short"];
  packIds.push(needStyleFull ? "style-full" : "style-short");
  if (hasMemory) packIds.push("memory-pack");
  if (hasSkills) packIds.push("dynamic-skills-pack");
  if (hasQualityFeedback) packIds.push("quality-repair-pack");
  if (needRiskPack) packIds.push("risk-pack");
  return packIds;
}

module.exports = { planPromptPacks };
