#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const RULES = {
  core: new Set(["core", "observability"]),
  memory: new Set(["memory", "runtime"]),
  learning: new Set(["learning", "memory"]),
  mind: new Set(["mind"]),
  providers: new Set(["providers"]),
  router: new Set(["router", "providers"]),
  daemon: new Set(["daemon", "core", "memory", "learning", "mind", "observability", "router", "runtime"]),
  ops: new Set(["ops", "runtime"]),
  runtime: new Set(["runtime", "core", "memory", "router"]),
  observability: new Set(["observability"]),
};

function main() {
  const files = listJsFiles(SRC);
  const violations = [];
  for (const file of files) {
    const rel = path.relative(SRC, file);
    const fromLayer = rel.split(path.sep)[0];
    if (!RULES[fromLayer]) continue;

    const text = fs.readFileSync(file, "utf8");
    const requires = parseRequires(text);
    for (const req of requires) {
      if (!req.startsWith(".")) continue;
      const target = resolveRequire(file, req);
      if (!target.startsWith(SRC)) continue;
      const targetRel = path.relative(SRC, target);
      const toLayer = targetRel.split(path.sep)[0];
      if (!toLayer || toLayer === fromLayer) continue;
      if (!RULES[fromLayer].has(toLayer)) {
        violations.push({
          file: rel,
          from: fromLayer,
          to: toLayer,
          req,
        });
      }
    }
  }

  if (violations.length) {
    console.error("Architecture boundary check: FAIL");
    for (const v of violations) {
      console.error(`- ${v.file}: ${v.from} -> ${v.to} via ${v.req}`);
    }
    process.exit(1);
  }

  console.log("Architecture boundary check: PASS");
}

function listJsFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...listJsFiles(full));
    } else if (name.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}

function parseRequires(text) {
  const out = [];
  const re = /require\((["'])([^"']+)\1\)/g;
  let m = re.exec(text);
  while (m) {
    out.push(m[2]);
    m = re.exec(text);
  }
  return out;
}

function resolveRequire(fromFile, req) {
  const base = path.resolve(path.dirname(fromFile), req);
  const withJs = `${base}.js`;
  if (fs.existsSync(withJs)) return withJs;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    const idx = path.join(base, "index.js");
    if (fs.existsSync(idx)) return idx;
  }
  return base;
}

main();
