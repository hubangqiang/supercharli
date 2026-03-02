#!/usr/bin/env node
const fs = require("fs");
const net = require("net");
const path = require("path");
const readline = require("readline");
const { getDefaultRuntimeDir, getDefaultSocketPath } = require("../src/runtime/runtimePaths");

function runtimePaths() {
  const runtimeDir = getDefaultRuntimeDir(process.env);
  return {
    runtimeDir,
    socketPath: getDefaultSocketPath(process.env),
    sessionFile: path.join(runtimeDir, "last-session.txt"),
  };
}

function parseArgs(argv) {
  const out = { sessionId: null, text: null, complexity: null, mode: "chat" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--session" && argv[i + 1]) {
      out.sessionId = argv[++i];
    } else if (token === "--text" && argv[i + 1]) {
      out.text = argv[++i];
    } else if (token === "--deep") {
      out.complexity = "deep";
    } else if (token === "--metrics") {
      out.mode = "metrics";
    } else if (token === "--help") {
      out.mode = "help";
    }
  }
  return out;
}

function generateSessionId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `session-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function resolveSessionId(explicitSessionId) {
  if (explicitSessionId) {
    saveLastSessionId(explicitSessionId);
    return explicitSessionId;
  }

  const { runtimeDir, sessionFile } = runtimePaths();
  fs.mkdirSync(runtimeDir, { recursive: true });
  if (fs.existsSync(sessionFile)) {
    const value = fs.readFileSync(sessionFile, "utf8").trim();
    if (value) return value;
  }

  const created = generateSessionId();
  saveLastSessionId(created);
  return created;
}

function saveLastSessionId(sessionId) {
  const { runtimeDir, sessionFile } = runtimePaths();
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(sessionFile, `${sessionId}\n`);
}

function sendRequest(payload) {
  const { socketPath } = runtimePaths();

  return new Promise((resolve, reject) => {
    const client = net.createConnection(socketPath);
    client.setEncoding("utf8");
    let buffer = "";

    client.on("error", (err) => reject(err));
    client.on("connect", () => {
      client.write(`${JSON.stringify(payload)}\n`);
    });
    client.on("data", (chunk) => {
      buffer += chunk;
      const idx = buffer.indexOf("\n");
      if (idx < 0) return;

      const line = buffer.slice(0, idx).trim();
      client.end();
      if (!line) {
        reject(new Error("empty_response"));
        return;
      }

      let json;
      try {
        json = JSON.parse(line);
      } catch {
        reject(new Error("invalid_response"));
        return;
      }

      if (!json.ok) {
        reject(new Error(json.error || "request_failed"));
        return;
      }

      resolve(json.data);
    });
  });
}

async function runSingle(args) {
  if (args.mode === "metrics") {
    const data = await sendRequest({ type: "metrics" });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (!args.text) {
    console.error("--text is required for single request mode");
    process.exit(1);
  }

  const data = await sendRequest({
    type: "chat",
    sessionId: resolveSessionId(args.sessionId),
    text: args.text,
    complexity: args.complexity,
  });

  console.log(data.response.conclusion);
}

async function runInteractive(args) {
  const sessionId = resolveSessionId(args.sessionId);
  console.log(`SuperCharli interactive mode (session=${sessionId})`);
  const debugInjection = process.env.SUPERCHARLI_DEBUG_INJECTION === "1";
  console.log(
    debugInjection
      ? "Type /exit to quit, /deep to toggle deep mode, /metrics for runtime metrics, /injection for last prompt injection."
      : "Type /exit to quit, /deep to toggle deep mode, /metrics for runtime metrics.",
  );

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
  let deepMode = false;
  let lastMeta = null;
  rl.prompt();

  rl.on("line", async (line) => {
    const text = line.trim();
    if (!text) {
      rl.prompt();
      return;
    }

    if (text === "/exit") {
      rl.close();
      return;
    }

    if (text === "/deep") {
      deepMode = !deepMode;
      console.log(`deep mode: ${deepMode ? "on" : "off"}`);
      rl.prompt();
      return;
    }

    if (text === "/metrics") {
      try {
        const metrics = await sendRequest({ type: "metrics" });
        console.log(JSON.stringify(metrics, null, 2));
      } catch (err) {
        console.error(`error: ${err.message}`);
      }
      rl.prompt();
      return;
    }

    if (text === "/injection" && debugInjection) {
      const injection = lastMeta?.injection;
      if (!injection) {
        console.log("no injection data yet; send one message first.");
      } else {
        console.log(
          JSON.stringify(
            {
              promptTokensUsed: injection.promptTokensUsed,
              droppedPacks: injection.droppedPacks,
              loadedPackIds: injection.loadedPackIds,
              route: lastMeta.route,
              modelProvider: lastMeta.modelProvider,
              model: lastMeta.model,
            },
            null,
            2,
          ),
        );
      }
      rl.prompt();
      return;
    }

    try {
      const data = await sendRequest({
        type: "chat",
        sessionId,
        text,
        complexity: deepMode ? "deep" : undefined,
      });
      lastMeta = data.meta || null;
      console.log(`charli: ${data.response.conclusion}`);
    } catch (err) {
      console.error(`error: ${err.message}`);
    }

    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode === "help") {
    console.log("Usage:");
    console.log("  supercharli-cli --text \"你好\" --session main");
    console.log("  supercharli-cli --metrics");
    console.log("  supercharli-cli --session main   (interactive mode)");
    console.log("  supercharli-cli                  (auto reuse last session)");
    return;
  }

  if (args.text || args.mode === "metrics") {
    await runSingle(args);
    return;
  }

  await runInteractive(args);
}

main().catch((err) => {
  console.error(`fatal: ${err.message}`);
  process.exit(1);
});
