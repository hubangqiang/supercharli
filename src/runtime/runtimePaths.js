const os = require("os");
const path = require("path");

function getRuntimeHome(env = process.env) {
  return env.SUPERCHARLI_RUNTIME_HOME || path.join(os.homedir(), "supercharli-runtime");
}

function getDefaultDbPath(env = process.env) {
  return env.SUPERCHARLI_DB_PATH || path.join(getRuntimeHome(env), "data", "supercharli.db");
}

function getDefaultBackupDir(env = process.env) {
  return env.SUPERCHARLI_BACKUP_DIR || path.join(getRuntimeHome(env), "backups");
}

function getDefaultRuntimeDir(env = process.env) {
  return env.SUPERCHARLI_RUNTIME_DIR || path.join(getRuntimeHome(env), "run");
}

function getDefaultSocketPath(env = process.env) {
  return env.SUPERCHARLI_SOCKET_PATH || path.join(getDefaultRuntimeDir(env), "daemon.sock");
}

module.exports = {
  getRuntimeHome,
  getDefaultDbPath,
  getDefaultBackupDir,
  getDefaultRuntimeDir,
  getDefaultSocketPath,
};
