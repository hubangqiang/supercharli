function estimateTokens(text) {
  const s = String(text || "");
  return Math.ceil(s.length / 2.2);
}

function enforcePromptBudget(packs, budget = 1800) {
  const sorted = [...packs].sort((a, b) => (a.priority || 100) - (b.priority || 100));
  const selected = [];
  let used = 0;

  for (const pack of sorted) {
    const required = Boolean(pack.required);
    let text = String(pack.text || "");
    let tokens = estimateTokens(text);

    if (pack.maxTokens && tokens > pack.maxTokens) {
      text = clipToTokenBudget(text, pack.maxTokens);
      tokens = estimateTokens(text);
    }

    if (!required && used + tokens > budget) continue;

    if (required && used + tokens > budget) {
      const remaining = budget - used;
      if (remaining <= 0) break;
      text = clipToTokenBudget(text, remaining);
      tokens = estimateTokens(text);
      if (tokens > remaining) {
        text = clipToTokenBudget(text, Math.max(1, remaining - 2));
        tokens = estimateTokens(text);
      }
    }

    if (used + tokens > budget) continue;
    selected.push({ ...pack, text, tokens });
    used += tokens;
    if (used >= budget) break;
  }

  return { selected, usedTokens: used, dropped: sorted.length - selected.length };
}

function clipToTokenBudget(text, tokenBudget) {
  const maxChars = Math.max(60, Math.floor(tokenBudget * 2.2));
  const s = String(text || "");
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars - 32)}\n[...truncated by budget controller]`;
}

module.exports = { estimateTokens, enforcePromptBudget, clipToTokenBudget };
