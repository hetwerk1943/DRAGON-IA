'use strict';

/**
 * RepoAgent – analyzes repositories, generates patch suggestions and reports.
 */
class RepoAgent {
  constructor(orchestrator) {
    this.name = 'repo-agent';
    this.orchestrator = orchestrator;
    this.status = 'idle';
  }

  async analyze(payload = {}) {
    this.status = 'running';
    const report = {
      agent: this.name,
      timestamp: new Date().toISOString(),
      repo: payload.repo || 'unknown',
      findings: [],
      patches: [],
      score: null,
    };

    try {
      const findings = await this._scanRepo(payload);
      report.findings = findings;
      report.patches = this._generatePatches(findings);
      report.score = this._scoreRepo(findings);
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

  async _scanRepo(payload) {
    const findings = [];

    if (!payload.files || payload.files.length === 0) {
      findings.push({ type: 'info', message: 'No files provided for analysis.' });
      return findings;
    }

    for (const file of payload.files) {
      if (!file.name || typeof file.content !== 'string') continue;

      if (file.content.includes('TODO') || file.content.includes('FIXME')) {
        findings.push({ type: 'warning', file: file.name, message: 'TODO/FIXME comment found.' });
      }
      if (/console\.log\s*\(/.test(file.content)) {
        findings.push({ type: 'warning', file: file.name, message: 'console.log detected in production code.' });
      }
      if (/eval\s*\(/.test(file.content)) {
        findings.push({ type: 'critical', file: file.name, message: 'eval() usage detected – potential security risk.' });
      }
      if (/require\s*\(\s*['"]child_process['"]\s*\)/.test(file.content)) {
        findings.push({ type: 'warning', file: file.name, message: 'child_process usage detected – review carefully.' });
      }
    }

    return findings;
  }

  _generatePatches(findings) {
    return findings
      .filter(f => f.type !== 'info')
      .map(f => ({
        file: f.file || 'unknown',
        suggestion: `Fix: ${f.message}`,
        automated: f.type !== 'critical',
      }));
  }

  _scoreRepo(findings) {
    const critical = findings.filter(f => f.type === 'critical').length;
    const warnings = findings.filter(f => f.type === 'warning').length;
    return Math.max(0, 100 - critical * 20 - warnings * 5);
  }

  getStatus() {
    return { agent: this.name, status: this.status };
  }
}

module.exports = RepoAgent;
