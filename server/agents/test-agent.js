'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

/**
 * TestAgent – runs linting, node checks, and JSON lint tasks.
 */
class TestAgent {
  constructor(orchestrator) {
    this.name = 'test-agent';
    this.orchestrator = orchestrator;
    this.status = 'idle';
  }

  async run(payload = {}) {
    this.status = 'running';
    const report = {
      agent: this.name,
      timestamp: new Date().toISOString(),
      results: [],
      passed: 0,
      failed: 0,
    };

    try {
      if (payload.runLint !== false) {
        const lintResult = await this._runLint(payload.cwd, payload.entryFile);
        report.results.push(lintResult);
      }

      if (payload.jsonFiles && payload.jsonFiles.length > 0) {
        for (const file of payload.jsonFiles) {
          report.results.push(this._lintJson(file.name, file.content));
        }
      }

      report.passed = report.results.filter(r => r.passed).length;
      report.failed = report.results.filter(r => !r.passed).length;
      this.status = 'idle';
      this.orchestrator.emit('report', { agent: this.name, report });
      return report;
    } catch (err) {
      this.status = 'error';
      report.error = err.message;
      this.orchestrator.emit('error', { agent: this.name, error: err.message });
      return report;
    }
  }

  async _runLint(cwd, entryFile) {
    try {
      const dir = cwd || process.cwd();
      const file = entryFile || 'server/index.js';
      await execFileAsync('node', ['--check', file], { cwd: dir });
      return { task: 'node-check', passed: true, output: 'Node syntax OK' };
    } catch (err) {
      return { task: 'node-check', passed: false, output: err.stderr || err.message };
    }
  }

  _lintJson(name, content) {
    try {
      JSON.parse(content);
      return { task: `json-lint:${name}`, passed: true, output: 'Valid JSON' };
    } catch (err) {
      return { task: `json-lint:${name}`, passed: false, output: err.message };
    }
  }

  getStatus() {
    return { agent: this.name, status: this.status };
  }
}

module.exports = TestAgent;
