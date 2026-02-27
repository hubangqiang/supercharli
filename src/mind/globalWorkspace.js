function buildGlobalWorkspace(input = {}, options = {}) {
  const budget = Math.max(3, Math.min(5, Number(options.budget || 5)));
  const blocks = [];

  if (input.goal) blocks.push({ type: "goal", text: String(input.goal) });
  if (input.personaConstraint) blocks.push({ type: "persona", text: String(input.personaConstraint) });
  if (input.severity) blocks.push({ type: "severity", text: String(input.severity) });

  const l1 = Array.isArray(input.l1) ? input.l1.slice(-2) : [];
  for (const e of l1) {
    blocks.push({ type: "l1", text: String(e.text || "") });
  }

  const l2 = Array.isArray(input.recalled) ? input.recalled.slice(0, 2) : [];
  for (const e of l2) {
    blocks.push({ type: "l2", text: String(e.summary || e.key || "") });
  }

  const trimmed = blocks
    .map((b) => ({ ...b, text: truncate(compact(b.text), 90) }))
    .filter((b) => b.text)
    .slice(0, budget);

  return {
    budget,
    blocks: trimmed,
  };
}

function compact(s) {
  return s.replace(/\s+/g, " ").trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 3)}...`;
}

module.exports = { buildGlobalWorkspace };
