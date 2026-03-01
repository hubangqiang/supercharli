function buildRequestContextPrompt(context = {}) {
  const l1 = Array.isArray(context.l1) ? context.l1.slice(-6) : [];
  const l2 = Array.isArray(context.recalled) ? context.recalled.slice(0, 5) : [];

  const lines = [
    "Stateless execution rules:",
    "- Do not use any hidden provider-side conversation memory.",
    "- Do not assume any prior turns unless they appear in the memory snapshot below.",
    "- Build response only from: persona contract, memory snapshot, current user input.",
    "- Treat local memory/learning as augmentation context; do not claim local system replaces model reasoning.",
    "- Do not claim 'again/previously/last time/又见到你/之前聊过' unless L1 or L2 snapshot contains explicit evidence.",
    "",
    "Memory snapshot (L1 recent events):",
  ];

  if (!l1.length) {
    lines.push("- (none)");
  } else {
    for (const item of l1) {
      const text = String(item.text || "").replace(/\s+/g, " ").trim();
      const severity = item.severity || "normal";
      lines.push(`- [${severity}] ${text}`);
    }
  }

  lines.push("", "Memory snapshot (L2 long-term recalled):");
  if (!l2.length) {
    lines.push("- (none)");
  } else {
    for (const item of l2) {
      const summary = String(item.summary || "").replace(/\s+/g, " ").trim();
      const strategy = String(item.strategy || "").replace(/\s+/g, " ").trim();
      lines.push(`- ${summary}`);
      if (strategy) lines.push(`  strategy: ${strategy}`);
    }
  }

  return lines.join("\n");
}

module.exports = { buildRequestContextPrompt };
