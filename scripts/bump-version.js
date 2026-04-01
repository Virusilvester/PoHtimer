#!/usr/bin/env node
/**
 * PoHtimer Version Bump Script
 * Usage: node scripts/bump-version.js <new-version>
 * Example: node scripts/bump-version.js 1.2.0
 *
 * Updates all version fields atomically:
 *   - package.json
 *   - src-tauri/Cargo.toml
 *   - src-tauri/tauri.conf.json
 *
 * Then prints the git commands to tag and push the release.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Validate input ───────────────────────────────────────────
const newVersion = process.argv[2];
if (!newVersion) {
  console.error("❌  Usage: node scripts/bump-version.js <version>");
  console.error("    Example: node scripts/bump-version.js 1.2.0");
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`❌  Invalid version: "${newVersion}"`);
  console.error(
    "    Must match: MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-prerelease",
  );
  process.exit(1);
}

// ── Helper functions ─────────────────────────────────────────
function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  writeFileSync(filePath, content, "utf8");
}

function bumpCargoToml(filePath, version) {
  let content = readText(filePath);
  // Replace the first version = "..." in [package] section
  content = content.replace(/^(version\s*=\s*)"[^"]+"/m, `$1"${version}"`);
  writeText(filePath, content);
}

// ── File paths ───────────────────────────────────────────────
const packageJsonPath = resolve(ROOT, "package.json");
const cargoTomlPath = resolve(ROOT, "src-tauri/Cargo.toml");
const tauriConfPath = resolve(ROOT, "src-tauri/tauri.conf.json");

// ── Read current versions ────────────────────────────────────
const pkg = readJSON(packageJsonPath);
const tauriConf = readJSON(tauriConfPath);

const oldVersion = pkg.version;

console.log(`\n🔖  PoHtimer Version Bump`);
console.log(`    ${oldVersion}  →  ${newVersion}\n`);

// ── Bump each file ───────────────────────────────────────────
// 1. package.json
pkg.version = newVersion;
writeJSON(packageJsonPath, pkg);
console.log(`✓   package.json           ${oldVersion} → ${newVersion}`);

// 2. src-tauri/Cargo.toml
bumpCargoToml(cargoTomlPath, newVersion);
console.log(`✓   src-tauri/Cargo.toml   → ${newVersion}`);

// 3. src-tauri/tauri.conf.json
tauriConf.version = newVersion;
writeJSON(tauriConfPath, tauriConf);
console.log(`✓   tauri.conf.json        → ${newVersion}`);

// ── Print next steps ─────────────────────────────────────────
console.log(`
─────────────────────────────────────────────────
🚀  Next steps to publish this release:

    git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
    git commit -m "chore: bump version to ${newVersion}"
    git tag v${newVersion}
    git push origin main --tags

    This will trigger the Release workflow automatically.
─────────────────────────────────────────────────
`);
