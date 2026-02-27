function rankRecalledItems(items = [], query = "", limit = 5) {
  const lower = String(query || "").toLowerCase();
  const ranked = items
    .map((item) => ({ ...item, _score: scoreItem(item, lower) }))
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    })
    .slice(0, Math.max(1, limit));

  return ranked.map(({ _score, ...rest }) => rest);
}

function scoreItem(item, lowerQuery) {
  const key = String(item.key || "").toLowerCase();
  const summary = String(item.summary || "").toLowerCase();
  const strategy = String(item.strategy || "").toLowerCase();
  const strength = Number(item.strength || 0.5);

  let relevance = 0;
  if (lowerQuery.includes(key) && key) relevance += 1.0;
  if (summary && lowerQuery && summary.includes(lowerQuery)) relevance += 0.8;
  if (strategy && lowerQuery && strategy.includes(lowerQuery)) relevance += 0.3;

  return relevance * 0.6 + strength * 0.4;
}

module.exports = { rankRecalledItems };
