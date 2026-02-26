#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { getDefaultRuntimeDir, getDefaultSocketPath } = require("../src/runtime/runtimePaths");

function runtimePaths() {
  const runtimeDir = getDefaultRuntimeDir(process.env);
  return {
    runtimeDir,
    socketPath: getDefaultSocketPath(process.env),
    pidPath: path.join(runtimeDir, "daemon.pid"),
    logPath: path.join(runtimeDir, "daemon.log"),
  };
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(pidPath) {
  if (!fs.existsSync(pidPath)) return null;
  const value = fs.readFileSync(pidPath, "utf8").trim();
  const pid = Number(value);
  return Number.isFinite(pid) ? pid : null;
}

function start() {
  const paths = runtimePaths();
  fs.mkdirSync(paths.runtimeDir, { recursive: true });

  const existing = readPid(paths.pidPath);
  if (existing && isPidAlive(existing)) {
    console.log(`daemon already running: pid=${existing}`);
    return;
  }

  const out = fs.openSync(paths.logPath, "a");
  const err = fs.openSync(paths.logPath, "a");
  const child = spawn(process.execPath, [path.join(__dirname, "supercharli-daemon-server.js")], {
    detached: true,
    stdio: ["ignore", out, err],
    env: process.env,
  });

  child.unref();
  console.log(`daemon started: pid=${child.pid}`);
  console.log(`log: ${paths.logPath}`);
}

function stop() {
  const paths = runtimePaths();
  const pid = readPid(paths.pidPath);
  if (!pid) {
    console.log("daemon not running");
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {}

  try {
    if (fs.existsSync(paths.pidPath)) fs.rmSync(paths.pidPath, { force: true });
  } catch {}

  console.log(`daemon stop signal sent: pid=${pid}`);
}

function status() {
  const paths = runtimePaths();
  const pid = readPid(paths.pidPath);
  const alive = pid ? isPidAlive(pid) : false;

  if (!alive) {
    console.log("daemon status: stopped");
    return;
  }

  console.log("daemon status: running");
  console.log(`pid: ${pid}`);
  console.log(`socket: ${paths.socketPath}`);
  console.log(`log: ${paths.logPath}`);
}

function usage() {
  console.log("Usage: node scripts/supercharli-daemon.js <start|stop|status>");
}

const cmd = process.argv[2];
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "status") status();
else usage();
