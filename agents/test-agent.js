'use strict';
/**
 * Test Agent – performs static checks: JSON validation, JS syntax, lint-style rules.
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT   = path.join(__dirname, '..');
const IGNORE = new Set(['node_modules', '.git', 'data', 'logs']);

function findFiles(dir, ext, results = []) {
  let items;
  try { items = fs.readdirSync(dir); } catch { return results; }
  for (const item of items) {
    if (IGNORE.has(item)) continue;
    const full = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) findFiles(full, ext, results);
    else if (item.endsWith(ext)) results.push(full);
  }
  return results;
}

function checkJsonFiles() {
  const jsonFiles = findFiles(ROOT, '.json');
  const results = [];
  for (const f of jsonFiles) {
    const rel = path.relative(ROOT, f);
    try {
      JSON.parse(fs.readFileSync(f, 'utf8'));
      results.push({ file: rel, status: 'ok' });
    } catch (e) {
      results.push({ file: rel, status: 'error', message: e.message });
    }
  }
  return results;
}

function checkJsSyntax() {
  const jsFiles = findFiles(ROOT, '.js');
  const results = [];
  for (const f of jsFiles) {
    const rel = path.relative(ROOT, f);
    try {
      execSync(`node --check "${f}"`, { stdio: 'pipe' });
      results.push({ file: rel, status: 'ok' });
    } catch (e) {
      results.push({ file: rel, status: 'error', message: e.stderr ? e.stderr.toString().trim() : e.message });
    }
  }
  return results;
}

function checkPackageJson() {
  const pkgPath = path.join(ROOT, 'package.json');
  const issues = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const requiredDeps = ['express', 'cors', 'uuid', 'openai', 'dotenv', 'ws'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies || !pkg.dependencies[dep]) {
        issues.push(`Missing dependency: ${dep}`);
      }
    }
    if (!pkg.scripts || !pkg.scripts.start) issues.push('No start script in package.json');
  } catch (e) {
    issues.push(`Cannot parse package.json: ${e.message}`);
  }
  return issues;
}

async function run() {
  const jsonResults = checkJsonFiles();
  const jsResults   = checkJsSyntax();
  const pkgIssues   = checkPackageJson();

  const jsonErrors = jsonResults.filter(r => r.status === 'error');
  const jsErrors   = jsResults.filter(r => r.status === 'error');

  const passed = jsonErrors.length === 0 && jsErrors.length === 0 && pkgIssues.length === 0;

  return {
    agent: 'test',
    ts: new Date().toISOString(),
    passed,
    summary: {
      jsonFilesChecked: jsonResults.length,
      jsonErrors: jsonErrors.length,
      jsFilesChecked: jsResults.length,
      jsErrors: jsErrors.length,
      packageIssues: pkgIssues.length,
    },
    details: {
      json: jsonResults,
      js: jsResults,
      package: pkgIssues,
    },
  };
}

module.exports = { run };
