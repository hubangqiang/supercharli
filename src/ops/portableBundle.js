const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { getDefaultDbPath, getRuntimeHome } = require("../runtime/runtimePaths");

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function defaultUserConfigDir(env = process.env) {
  return env.SUPERCHARLI_USER_CONFIG_DIR || path.join(os.homedir(), ".config", "supercharli");
}

function defaultPaths(env = process.env) {
  const userDir = defaultUserConfigDir(env);
  const runtimeHome = getRuntimeHome(env);
  return {
    dbPath: getDefaultDbPath(env),
    profilePath: env.SUPERCHARLI_PROFILE_FILE || path.join(userDir, "charli.profile.json"),
    providersPath: env.SUPERCHARLI_PROVIDER_CONFIG_FILE || path.join(userDir, "providers.config.json"),
    envPath: env.SUPERCHARLI_ENV_FILE || path.join(userDir, "supercharli.env.sh"),
    exportRoot: env.SUPERCHARLI_EXPORT_DIR || path.join(runtimeHome, "exports"),
  };
}

function createBundle(options = {}) {
  const env = options.env || process.env;
  const paths = { ...defaultPaths(env), ...(options.paths || {}) };

  const bundleId = options.bundleId || `bundle-${timestampId(new Date())}`;
  const bundleDir = options.bundleDir || path.join(paths.exportRoot, bundleId);
  fs.mkdirSync(bundleDir, { recursive: true });

  const files = [];
  const addIfExists = (source, relative, required) => {
    if (!fs.existsSync(source)) {
      if (required) throw new Error(`required file missing: ${source}`);
      return;
    }
    const target = path.join(bundleDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    files.push({
      path: relative,
      sha256: sha256File(target),
      size: fs.statSync(target).size,
      required,
    });
  };

  addIfExists(paths.dbPath, path.join("runtime", "memory.db"), false);
  addIfExists(paths.profilePath, path.join("config", "charli.profile.json"), false);
  addIfExists(paths.providersPath, path.join("config", "providers.config.json"), false);
  addIfExists(paths.envPath, path.join("config", "supercharli.env.sh"), false);

  const manifest = {
    version: 1,
    bundleId,
    createdAt: new Date().toISOString(),
    files,
  };

  fs.writeFileSync(path.join(bundleDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return { bundleDir, bundleId, fileCount: files.length };
}

function verifyBundle(bundleDir) {
  const manifestPath = path.join(bundleDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json not found in bundle");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const f of manifest.files) {
    const target = path.join(bundleDir, f.path);
    if (!fs.existsSync(target)) {
      throw new Error(`bundle file missing: ${f.path}`);
    }
    const digest = sha256File(target);
    if (digest !== f.sha256) {
      throw new Error(`bundle checksum mismatch: ${f.path}`);
    }
  }
  return manifest;
}

function restoreBundle(options = {}) {
  const env = options.env || process.env;
  const paths = { ...defaultPaths(env), ...(options.paths || {}) };
  const bundleDir = options.bundleDir;
  if (!bundleDir) throw new Error("bundleDir is required");

  const manifest = verifyBundle(bundleDir);
  const backups = [];

  const restoreOne = (relative, target) => {
    const source = path.join(bundleDir, relative);
    if (!fs.existsSync(source)) return;

    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
      const backup = `${target}.bak.${Date.now()}`;
      fs.copyFileSync(target, backup);
      backups.push(backup);
    }
    fs.copyFileSync(source, target);
  };

  restoreOne(path.join("runtime", "memory.db"), paths.dbPath);
  restoreOne(path.join("config", "charli.profile.json"), paths.profilePath);
  restoreOne(path.join("config", "providers.config.json"), paths.providersPath);
  restoreOne(path.join("config", "supercharli.env.sh"), paths.envPath);

  return {
    restoredFrom: bundleDir,
    bundleId: manifest.bundleId,
    restoredFiles: manifest.files.length,
    backups,
  };
}

function timestampId(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

module.exports = {
  createBundle,
  verifyBundle,
  restoreBundle,
  defaultPaths,
};
