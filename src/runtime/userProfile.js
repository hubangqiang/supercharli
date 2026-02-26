const fs = require("fs");
const os = require("os");
const path = require("path");

function getRepoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function getBaseProfilePath(env = process.env) {
  return env.SUPERCHARLI_BASE_PROFILE_FILE || path.join(getRepoRoot(), "config", "charli.profile.base.json");
}

function getDefaultProfilePath(env = process.env) {
  return env.SUPERCHARLI_PROFILE_FILE || path.join(os.homedir(), ".config", "supercharli", "charli.profile.json");
}

function readProfileFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadBaseProfile(env = process.env) {
  return readProfileFile(getBaseProfilePath(env));
}

function loadUserProfile(env = process.env) {
  const base = loadBaseProfile(env) || {};
  const user = readProfileFile(getDefaultProfilePath(env)) || {};
  const merged = {
    ...base,
    ...user,
  };

  return Object.keys(merged).length ? merged : null;
}

module.exports = {
  getBaseProfilePath,
  getDefaultProfilePath,
  loadBaseProfile,
  loadUserProfile,
};
