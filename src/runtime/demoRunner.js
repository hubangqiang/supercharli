const { Kernel } = require("../core/kernel");
const { InMemoryMemoryEngine } = require("../memory/inMemoryMemoryEngine");
const { BasicModelRouter } = require("../router/basicModelRouter");

async function main() {
  const memory = new InMemoryMemoryEngine();
  const router = new BasicModelRouter();
  const kernel = new Kernel(memory, router);

  const turns = [
    { sessionId: "demo-1", text: "我最近很焦虑，计划总是执行不下去", riskSignals: ["stress-rise"] },
    { sessionId: "demo-1", text: "我又拖延了，连续失败", riskSignals: ["repeated-failure"] },
    { sessionId: "demo-1", text: "我想孤注一掷 high-risk", riskSignals: ["guardrail-risk"] },
    { sessionId: "demo-1", text: "请给我一个多步权衡方案", complexity: "deep" },
    { sessionId: "demo-1", text: "force-error to test fallback" },
  ];

  for (const turn of turns) {
    const out = await kernel.runTurn(turn);
    console.log("\n--- TURN ---");
    console.log("input:", turn.text);
    console.log("response:", out.response);
    console.log("meta:", out.meta);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
