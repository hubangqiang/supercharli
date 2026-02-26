#!/usr/bin/env node
const path = require("path");
const { createBundle } = require("../src/ops/portableBundle");

function main() {
  const arg = process.argv[2];
  const bundleDir = arg ? path.resolve(process.cwd(), arg) : undefined;
  const result = createBundle({ bundleDir, env: process.env });
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main();
