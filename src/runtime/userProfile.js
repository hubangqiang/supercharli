const fs = require("fs");
const os = require("os");
const path = require("path");

function getDefaultProfilePath(env = process.env) {
  return env.SUPERCHARLI_PROFILE_FILE || path.join(os.homedir(), ".config", "supercharli", "charli.profile.json");
}

function loadUserProfile(env = process.env) {
  const file = getDefaultProfilePath(env);
  if (!fs.existsSync(file)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

module.exports = { getDefaultProfilePath, loadUserProfile };
