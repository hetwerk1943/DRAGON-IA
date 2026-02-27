'use strict';

/**
 * SecAgent – security scanning: CSP, XSS, CSRF, dependency checks.
 */
class SecAgent {
  constructor(orchestrator) {
    this.name = 'sec-agent';
    this.orchestrator = orchestrator;
    this.status = 'idle';
  }

  async scan(payload = {}) {
    this.status = 'running';
    const report = {
      agent: this.name,
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      securityScore: 100,
      cspValid: false,
      xssRisks: [],
      csrfRisks: [],
      dependencyAlerts: [],
    };

    try {
      if (payload.headers) {
        this._checkCsp(payload.headers, report);
      }
      if (payload.files) {
        for (const file of payload.files) {
          if (typeof file.content === 'string') {
            this._checkXss(file, report);
            this._checkCsrf(file, report);
          }
        }
      }
      if (payload.dependencies) {
        this._checkDependencies(payload.dependencies, report);
      }

      report.securityScore = this._computeScore(report);
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

  _checkCsp(headers, report) {
    const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];
    if (!csp) {
      report.vulnerabilities.push({ type: 'CSP', severity: 'high', message: 'Missing Content-Security-Policy header.' });
      report.cspValid = false;
    } else if (csp.includes('\'unsafe-inline\'') || csp.includes('\'unsafe-eval\'')) {
      report.vulnerabilities.push({ type: 'CSP', severity: 'medium', message: 'CSP allows \'unsafe-inline\' or \'unsafe-eval\'.' });
      report.cspValid = false;
    } else {
      report.cspValid = true;
    }
  }

  _checkXss(file, report) {
    const xssPatterns = [
      { re: /innerHTML\s*=/, msg: 'innerHTML assignment – potential XSS sink.' },
      { re: /document\.write\s*\(/, msg: 'document.write() – potential XSS sink.' },
      { re: /eval\s*\(/, msg: 'eval() – potential XSS / code injection.' },
    ];
    for (const { re, msg } of xssPatterns) {
      if (re.test(file.content)) {
        report.xssRisks.push({ file: file.name, message: msg });
        report.vulnerabilities.push({ type: 'XSS', severity: 'high', file: file.name, message: msg });
      }
    }
  }

  _checkCsrf(file, report) {
    if (/fetch\s*\(/.test(file.content) && !file.content.includes('csrf') && !file.content.includes('X-CSRF')) {
      report.csrfRisks.push({ file: file.name, message: 'fetch() call without visible CSRF token – review needed.' });
    }
  }

  _checkDependencies(deps, report) {
    const knownVulnerable = ['lodash@4.17.20', 'axios@0.21.0', 'minimist@1.2.0'];
    for (const dep of deps) {
      const key = `${dep.name}@${dep.version}`;
      if (knownVulnerable.includes(key)) {
        report.dependencyAlerts.push({ package: key, message: 'Known vulnerable version – update required.' });
        report.vulnerabilities.push({ type: 'DEPENDENCY', severity: 'high', message: `Vulnerable package: ${key}` });
      }
    }
  }

  _computeScore(report) {
    const high = report.vulnerabilities.filter(v => v.severity === 'high').length;
    const medium = report.vulnerabilities.filter(v => v.severity === 'medium').length;
    return Math.max(0, 100 - high * 15 - medium * 5);
  }

  getStatus() {
    return { agent: this.name, status: this.status };
  }
}

module.exports = SecAgent;
