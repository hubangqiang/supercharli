const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { createDaemonServer } = require("../src/daemon/server");

function send(socketPath, payload) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(socketPath);
    client.setEncoding("utf8");
    let buffer = "";

    client.on("error", reject);
    client.on("connect", () => client.write(`${JSON.stringify(payload)}\n`));
    client.on("data", (chunk) => {
      buffer += chunk;
      const idx = buffer.indexOf("\n");
      if (idx < 0) return;
      client.end();
      const line = buffer.slice(0, idx).trim();
      resolve(JSON.parse(line));
    });
  });
}

async function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-daemon-test-"));
  const socketPath = path.join(tmp, "daemon.sock");
  const dbPath = path.join(tmp, "memory.db");

  const daemon = createDaemonServer({ socketPath, dbPath, env: {} });
  await daemon.start();

  const ping = await send(socketPath, { type: "ping" });
  assert.strictEqual(ping.ok, true);
  assert.strictEqual(ping.data.type, "pong");

  const chat = await send(socketPath, { type: "chat", sessionId: "d1", text: "你好" });
  assert.strictEqual(chat.ok, true);
  assert.strictEqual(chat.data.type, "chat");
  assert.ok(chat.data.response.conclusion.includes("建议"));

  const metrics = await send(socketPath, { type: "metrics" });
  assert.strictEqual(metrics.ok, true);
  assert.ok(typeof metrics.data.turnCount === "number");

  await daemon.stop();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("daemon tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
