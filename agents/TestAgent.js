'use strict';
/**
 * TestAgent – runs linting, JSON validation and basic Node.js checks
 * against the local project directory.
 */
const BaseAgent = require('./BaseAgent');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function exec(cmd, args, cwd) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: 30000 }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code || 1) : 0, stdout, stderr });
    });
  });
}

class TestAgent extends BaseAgent {
  constructor() {
    super('TestAgent');
  }

  async _execute({ projectPath } = {}) {
    const cwd = projectPath || process.cwd();
    const result = {
      projectPath: cwd,
      checkedAt: new Date().toISOString(),
      checks: [],
      passed: 0,
      failed: 0,
    };

    // 1. Check for package.json
    const hasPkg = fs.existsSync(path.join(cwd, 'package.json'));
    result.checks.push({ name: 'package.json exists', passed: hasPkg });
    hasPkg ? result.passed++ : result.failed++;

    // 2. JSON lint – validate all .json files in project root
    if (hasPkg) {
      const jsonFiles = fs.readdirSync(cwd).filter(f => f.endsWith('.json'));
      for (const file of jsonFiles) {
        let valid = true;
        let msg = null;
        try {
          JSON.parse(fs.readFileSync(path.join(cwd, file), 'utf8'));
        } catch (e) {
          valid = false;
          msg = e.message;
        }
        result.checks.push({ name: `jsonlint: ${file}`, passed: valid, detail: msg });
        valid ? result.passed++ : result.failed++;
      }
    }

    // 3. Node version check
    const nodever = await exec(process.execPath, ['--version'], cwd);
    const nodeOk = nodever.code === 0;
    result.checks.push({ name: 'node-check', passed: nodeOk, detail: nodever.stdout.trim() });
    nodeOk ? result.passed++ : result.failed++;

    // 4. ESLint (only if binary is available)
    const eslintBin = path.join(cwd, 'node_modules', '.bin', 'eslint');
    if (fs.existsSync(eslintBin)) {
      const lint = await exec(eslintBin, ['.', '--ext', '.js', '--max-warnings=0'], cwd);
      const lintOk = lint.code === 0;
      result.checks.push({ name: 'eslint', passed: lintOk, detail: lint.stdout || lint.stderr });
      lintOk ? result.passed++ : result.failed++;
    }

    this._emit('result', result);
    return result;
  }
}

module.exports = new TestAgent();
