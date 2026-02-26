#!/usr/bin/env node
const path = require("path");
const { restoreBundle } = require("../src/ops/portableBundle");

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run import:bundle -- <bundle-dir>");
    process.exit(1);
  }

  const bundleDir = path.resolve(process.cwd(), arg);
  const result = restoreBundle({ bundleDir, env: process.env });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main();
