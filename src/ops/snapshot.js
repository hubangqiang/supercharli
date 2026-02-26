const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function resolveSnapshotFiles(rootDir, dbPath) {
  const files = [];

  if (fs.existsSync(dbPath)) {
    files.push({
      source: dbPath,
      relative: path.join("state", "memory.db"),
      required: true,
    });
  }

  const optionalFiles = [
    "persona.toml",
    "README.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "SUPPORT.md",
  ];

  for (const rel of optionalFiles) {
    const abs = path.join(rootDir, rel);
    if (fs.existsSync(abs)) {
      files.push({ source: abs, relative: path.join("meta", rel), required: false });
    }
  }

  const docsDir = path.join(rootDir, "docs");
  if (fs.existsSync(docsDir)) {
    const docFiles = walkFiles(docsDir);
    for (const abs of docFiles) {
      const rel = path.relative(rootDir, abs);
      files.push({ source: abs, relative: path.join("meta", rel), required: false });
    }
  }

  return files;
}

function walkFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(abs));
    } else {
      out.push(abs);
    }
  }
  return out;
}

function createSnapshot(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const dbPath = options.dbPath || path.join(rootDir, "data", "supercharli.db");
  const snapshotRoot = options.snapshotRoot || path.join(rootDir, "backups");
  const now = options.now || new Date();
  const id = options.snapshotId || formatSnapshotId(now);
  const snapshotDir = path.join(snapshotRoot, id);

  fs.mkdirSync(snapshotDir, { recursive: true });

  const files = resolveSnapshotFiles(rootDir, dbPath);
  const manifest = {
    version: 1,
    snapshotId: id,
    createdAt: now.toISOString(),
    files: [],
  };

  for (const item of files) {
    const target = path.join(snapshotDir, item.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(item.source, target);
    manifest.files.push({
      path: item.relative,
      sha256: sha256File(target),
      size: fs.statSync(target).size,
      required: item.required,
    });
  }

  fs.writeFileSync(path.join(snapshotDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  return {
    snapshotDir,
    snapshotId: id,
    fileCount: manifest.files.length,
  };
}

function verifySnapshot(snapshotDir) {
  const manifestPath = path.join(snapshotDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json not found");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const item of manifest.files) {
    const abs = path.join(snapshotDir, item.path);
    if (!fs.existsSync(abs)) {
      throw new Error(`missing snapshot file: ${item.path}`);
    }
    const actual = sha256File(abs);
    if (actual !== item.sha256) {
      throw new Error(`checksum mismatch: ${item.path}`);
    }
  }

  return manifest;
}

function restoreSnapshot(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const snapshotDir = options.snapshotDir;
  const dbPath = options.dbPath || path.join(rootDir, "data", "supercharli.db");

  if (!snapshotDir) {
    throw new Error("snapshotDir is required");
  }

  const manifest = verifySnapshot(snapshotDir);

  const dbRecord = manifest.files.find((f) => f.path === path.join("state", "memory.db"));
  if (!dbRecord) {
    throw new Error("state/memory.db not found in snapshot");
  }

  const srcDb = path.join(snapshotDir, dbRecord.path);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (fs.existsSync(dbPath)) {
    const backupName = `${dbPath}.bak.${Date.now()}`;
    fs.copyFileSync(dbPath, backupName);
  }

  fs.copyFileSync(srcDb, dbPath);
  return { restoredDb: dbPath, snapshotId: manifest.snapshotId };
}

function formatSnapshotId(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `snapshot-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

module.exports = {
  createSnapshot,
  verifySnapshot,
  restoreSnapshot,
  formatSnapshotId,
};
