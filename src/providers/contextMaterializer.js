function materializeMemoryPack(context = {}, options = {}) {
  const l1Limit = Math.max(1, Math.min(3, Number(options.l1Limit || 2)));
  const l2Limit = Math.max(1, Math.min(5, Number(options.l2Limit || 3)));
  const l1 = Array.isArray(context.l1) ? context.l1.slice(-l1Limit) : [];
  const l2 = Array.isArray(context.recalled) ? context.recalled.slice(0, l2Limit) : [];

  const lines = ["Memory focus pack:"];

  if (l1.length) {
    lines.push("- Recent events:");
    for (const item of l1) {
      const t = compact(String(item.text || ""));
      lines.push(`  - [${item.severity || "normal"}] ${truncate(t, 64)}`);
    }
  } else {
    lines.push("- Recent events: none");
  }

  if (l2.length) {
    lines.push("- Long-term patterns:");
    for (const item of l2) {
      const summary = truncate(compact(String(item.summary || item.key || "")), 72);
      const strategy = truncate(compact(String(item.strategy || "")), 72);
      lines.push(`  - ${summary}`);
      if (strategy) lines.push(`    action: ${strategy}`);
    }
  } else {
    lines.push("- Long-term patterns: none");
  }

  lines.push("- Rule: use only memory above; do not assume hidden history.");
  return lines.join("\n");
}

function compact(s) {
  return s.replace(/\s+/g, " ").trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 3)}...`;
}

module.exports = { materializeMemoryPack };
