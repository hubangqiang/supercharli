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

    if (isLearningQuestion(lower)) {
      return {
        model,
        content: buildLearningSummary(context),
      };
    }

    return {
      model,
      content: buildGeneralReply(context),
    };
  }
}

function isLearningQuestion(lower) {
  return /(最近.*学习|学到了什么|学习了什么|成长了什么|what.*learned|learned recently)/i.test(lower);
}

function buildLearningSummary(context = {}) {
  const recalled = Array.isArray(context.recalled) ? context.recalled : [];
  const l1 = Array.isArray(context.l1) ? context.l1 : [];
  const stage = context.learningStage || "apprentice";
  const policy = context.learningPolicy || {};
  const top = recalled.slice(0, 2).map((x) => x.summary || x.key).filter(Boolean);
  const recent = l1.slice(-3).map((x) => x.text).filter(Boolean);

  if (!top.length && !recent.length) {
    return `当前学习阶段：${stage}。最近还没有足够样本形成稳定结论。建议继续提供具体任务与结果回报，我会在模式稳定后输出可迁移经验。`;
  }

  const lines = [`当前学习阶段：${stage}。`];
  if (top.length) lines.push(`最近沉淀的长期经验：${top.join("；")}。`);
  if (recent.length) lines.push(`近期会话观察：${recent.join("；")}。`);
  if (Number.isFinite(policy.directness)) {
    lines.push(
      `策略偏好：directness=${to2(policy.directness)}，actionPressure=${to2(policy.actionPressure)}，reflectionDepth=${to2(policy.reflectionDepth)}。`,
    );
  }
  lines.push("下一步：继续用“任务-执行-结果”格式交流，我会提炼更稳定的可复用策略。");
  return lines.join("");
}

function buildGeneralReply(context = {}) {
  const recalledCount = Array.isArray(context.recalled) ? context.recalled.length : 0;
  const stage = context.learningStage || "apprentice";
  return `当前阶段：${stage}。我会基于现有记忆给出可执行建议。当前命中 ${recalledCount} 条长期记忆。`;
}

function to2(v) {
  return Number.isFinite(v) ? Number(v).toFixed(2) : "0.00";
}

module.exports = { MockAdapter };
