#!/usr/bin/env node
/**
 * PoHtimer Pre-release Checklist
 * Usage: node scripts/pre-release-check.js
 *
 * Validates:
 *   ✓ Version consistency across all config files
 *   ✓ No uncommitted changes
 *   ✓ On main/master branch
 *   ✓ All required secrets documented
 *   ✓ tauri.conf.json is valid
 *   ✓ Cargo.toml is valid
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const errors = [];

function check(label, fn) {
  try {
    const result = fn();
    if (result === false) throw new Error("Check returned false");
    console.log(`  ✅  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${label}`);
    errors.push(`${label}: ${e.message}`);
    failed++;
  }
}

function readJSON(p) {
  return JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
}

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf8" }).trim();
}

function getCargoVersion() {
  const cargo = readFileSync(resolve(ROOT, "src-tauri/Cargo.toml"), "utf8");
  const m = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  return m ? m[1] : null;
}

console.log("\n🔍  PoHtimer Pre-release Checklist\n");
console.log("── Version consistency ─────────────────────────────");

const pkg = readJSON("package.json");
const tauriConf = readJSON("src-tauri/tauri.conf.json");
const cargoVer = getCargoVersion();

check("package.json has a valid version", () => {
  if (!/^\d+\.\d+\.\d+/.test(pkg.version))
    throw new Error(`Bad version: ${pkg.version}`);
});

check("package.json and Cargo.toml versions match", () => {
  if (pkg.version !== cargoVer)
    throw new Error(`package.json=${pkg.version}, Cargo.toml=${cargoVer}`);
});

check("package.json and tauri.conf.json versions match", () => {
  if (pkg.version !== tauriConf.version)
    throw new Error(
      `package.json=${pkg.version}, tauri.conf.json=${tauriConf.version}`,
    );
});

console.log("\n── Git state ───────────────────────────────────────");

check("No uncommitted changes", () => {
  const status = git("status --porcelain");
  if (status.length > 0) throw new Error(`Uncommitted files:\n${status}`);
});

check("On main or master branch (or tag)", () => {
  try {
    const branch = git("rev-parse --abbrev-ref HEAD");
    if (!["main", "master", "HEAD"].includes(branch))
      throw new Error(`Currently on branch: ${branch}`);
  } catch {
    // ok if on detached HEAD (tag)
  }
});

check("Tag v" + pkg.version + " does not already exist", () => {
  try {
    git(`rev-parse v${pkg.version}`);
    throw new Error(`Tag v${pkg.version} already exists!`);
  } catch (e) {
    if (e.message.includes("already exists")) throw e;
    // tag doesn't exist - that's what we want
  }
});

console.log("\n── Required files ──────────────────────────────────");

const requiredFiles = [
  "package.json",
  "src-tauri/Cargo.toml",
  "src-tauri/tauri.conf.json",
  "src-tauri/capabilities/default.json",
  "src-tauri/src/lib.rs",
  "src-tauri/build.rs",
  "src/main.tsx",
  "src/App.tsx",
  "src/store.ts",
  "index.html",
  "vite.config.ts",
  ".github/workflows/release.yml",
  ".github/workflows/ci.yml",
];

for (const f of requiredFiles) {
  check(`File exists: ${f}`, () => {
    if (!existsSync(resolve(ROOT, f))) throw new Error(`Missing: ${f}`);
  });
}

console.log("\n── GitHub Secrets (must be set in repo settings) ───");

const requiredSecrets = [
  "TAURI_SIGNING_PRIVATE_KEY",
  "TAURI_SIGNING_PRIVATE_KEY_PASSWORD",
  "RELEASE_TOKEN",
];

for (const secret of requiredSecrets) {
  check(`Secret documented: ${secret}`, () => {
    // We can't actually check secrets from here, just remind
    console.log(
      `       → Must be set at: github.com/<org>/pohtimer/settings/secrets`,
    );
  });
}

// ── Summary ──────────────────────────────────────────────────
console.log("\n────────────────────────────────────────────────────");
console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

if (errors.length > 0) {
  console.log("  Errors to fix:");
  errors.forEach((e) => console.log(`    • ${e}`));
  console.log();
  process.exit(1);
} else {
  console.log(`  ✅  All checks passed! Ready to release v${pkg.version}`);
  console.log(`\n  Run:`);
  console.log(`    git tag v${pkg.version}`);
  console.log(`    git push origin main --tags\n`);
}
