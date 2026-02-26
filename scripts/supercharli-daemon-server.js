#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createDaemonServer } = require("../src/daemon/server");

function runtimePaths() {
  const runtimeDir = process.env.SUPERCHARLI_RUNTIME_DIR || path.join(os.homedir(), ".supercharli");
  return {
    runtimeDir,
    socketPath: process.env.SUPERCHARLI_SOCKET_PATH || path.join(runtimeDir, "daemon.sock"),
    dbPath:
      process.env.SUPERCHARLI_DB_PATH ||
      path.join(process.cwd(), "data", "supercharli.db"),
    pidPath: path.join(runtimeDir, "daemon.pid"),
  };
}

async function main() {
  const paths = runtimePaths();
  fs.mkdirSync(paths.runtimeDir, { recursive: true });
  fs.writeFileSync(paths.pidPath, String(process.pid));

  const daemon = createDaemonServer({
    socketPath: paths.socketPath,
    dbPath: paths.dbPath,
    env: process.env,
  });

  const cleanup = async () => {
    try {
      await daemon.stop();
    } catch {}
    try {
      if (fs.existsSync(paths.pidPath)) fs.rmSync(paths.pidPath, { force: true });
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await daemon.start();
  process.stdout.write(`supercharli daemon listening on ${paths.socketPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err.message}\n`);
  process.exit(1);
});
