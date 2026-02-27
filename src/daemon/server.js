const fs = require("fs");
const path = require("path");
const net = require("net");
const { Kernel } = require("../core/kernel");
const { SQLiteMemoryEngine } = require("../memory/sqliteMemoryEngine");
const { Learner } = require("../learning/learner");
const { SQLiteLearningStore } = require("../learning/sqliteLearningStore");
const { MindRuntime } = require("../mind");
const { Telemetry } = require("../observability/telemetry");
const { BasicModelRouter } = require("../router/basicModelRouter");
const { loadUserProfile } = require("../runtime/userProfile");

function createDaemonServer(options = {}) {
  const socketPath = options.socketPath;
  const dbPath = options.dbPath;
  const telemetry = options.telemetry || new Telemetry();

  if (!socketPath) {
    throw new Error("socketPath is required");
  }

  fs.mkdirSync(path.dirname(socketPath), { recursive: true });
  if (fs.existsSync(socketPath)) {
    fs.rmSync(socketPath, { force: true });
  }

  const memory = new SQLiteMemoryEngine({ dbPath });
  const router = new BasicModelRouter({ env: options.env });
  const learningStore = new SQLiteLearningStore({ dbPath, scope: "daemon-main" });
  const learner = new Learner({ store: learningStore });
  const mind = new MindRuntime();
  const kernel = new Kernel(memory, router, undefined, telemetry, learner, mind);

  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");
    let buffer = "";

    socket.on("data", async (chunk) => {
      buffer += chunk;
      let idx = buffer.indexOf("\n");
      while (idx >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        idx = buffer.indexOf("\n");
        if (!line) continue;

        let message;
        try {
          message = JSON.parse(line);
        } catch {
          socket.write(`${JSON.stringify({ ok: false, error: "invalid_json" })}\n`);
          continue;
        }

        try {
          const response = await handleRequest(message, kernel, telemetry, options.env || process.env);
          socket.write(`${JSON.stringify({ ok: true, data: response })}\n`);
        } catch (err) {
          socket.write(`${JSON.stringify({ ok: false, error: err.message || "unknown_error" })}\n`);
        }
      }
    });
  });

  function start() {
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, () => {
        fs.chmodSync(socketPath, 0o600);
        resolve();
      });
    });
  }

  function stop() {
    return new Promise((resolve) => {
      server.close(() => {
        try {
          memory.close();
        } catch {}
        try {
          learningStore.close();
        } catch {}
        try {
          if (fs.existsSync(socketPath)) fs.rmSync(socketPath, { force: true });
        } catch {}
        resolve();
      });
    });
  }

  return { start, stop, server };
}

async function handleRequest(message, kernel, telemetry, env) {
  const type = message.type;
  if (type === "ping") {
    return { type: "pong", ts: new Date().toISOString() };
  }

  if (type === "chat") {
    if (!message.text || !message.sessionId) {
      throw new Error("sessionId_and_text_required");
    }

    const out = await kernel.runTurn({
      sessionId: message.sessionId,
      text: message.text,
      complexity: message.complexity,
      riskSignals: message.riskSignals,
      personaProfile: loadUserProfile(env),
    });

    return {
      type: "chat",
      sessionId: message.sessionId,
      response: out.response,
      meta: out.meta,
    };
  }

  if (type === "metrics") {
    const kernelLearner = kernel.learner;
    const learningSnapshot = kernelLearner && typeof kernelLearner.snapshot === "function" ? kernelLearner.snapshot() : null;
    return {
      type: "metrics",
      turnCount: telemetry.getCount("turn_count"),
      fallbackCount: telemetry.getCount("fallback_activation_count"),
      personaViolationCount: telemetry.getCount("persona_violation_count"),
      learningStage: learningSnapshot?.stage?.stage || "apprentice",
      learningEventCount: learningSnapshot?.eventCount || 0,
      learningPolicy: learningSnapshot?.policy || null,
    };
  }

  throw new Error(`unsupported_request_type:${type}`);
}

module.exports = { createDaemonServer };
