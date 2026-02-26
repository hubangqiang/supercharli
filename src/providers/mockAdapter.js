class MockAdapter {
  constructor(name = "mock") {
    this.name = name;
  }

  async generate(model, context) {
    const lower = String(context.text || "").toLowerCase();

    if (model !== "safe-secondary" && lower.includes("force-error")) {
      throw new Error("simulated model failure");
    }

    if (lower.includes("force-all-fail")) {
      throw new Error("simulated chain failure");
    }

    if (lower.includes("force-certainty")) {
      return {
        model,
        content: "This is 100% guaranteed to succeed.",
      };
    }

    return {
      model,
      content: `建议：聚焦一个目标并立即执行第一步。上下文命中 ${context.recalled.length} 条长期记忆。`,
    };
  }
}

module.exports = { MockAdapter };
