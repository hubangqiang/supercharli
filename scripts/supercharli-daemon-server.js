#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createDaemonServer } = require("../src/daemon/server");
const { getDefaultDbPath, getDefaultRuntimeDir, getDefaultSocketPath } = require("../src/runtime/runtimePaths");

function runtimePaths() {
  const runtimeDir = getDefaultRuntimeDir(process.env);
  return {
    runtimeDir,
    socketPath: getDefaultSocketPath(process.env),
    dbPath: getDefaultDbPath(process.env),
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
