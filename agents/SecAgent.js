'use strict';
/**
 * SecAgent – security scanner.
 * Checks CSP configuration, common XSS/CSRF patterns, and npm audit.
 */
const BaseAgent = require('./BaseAgent');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function exec(cmd, args, cwd) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: 60000 }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code || 1) : 0, stdout, stderr });
    });
  });
}

class SecAgent extends BaseAgent {
  constructor() {
    super('SecAgent');
  }

  async _execute({ projectPath } = {}) {
    const cwd = projectPath || process.cwd();
    const report = {
      projectPath: cwd,
      scannedAt: new Date().toISOString(),
      findings: [],
      score: 100,
    };

    // 1. npm audit
    const hasPkg = fs.existsSync(path.join(cwd, 'package.json'));
    if (hasPkg) {
      const audit = await exec('npm', ['audit', '--json', '--audit-level=none'], cwd);
      try {
        const auditData = JSON.parse(audit.stdout);
        const vulns = auditData.metadata && auditData.metadata.vulnerabilities;
        if (vulns) {
          const total = Object.values(vulns).reduce((s, n) => s + n, 0);
          const critical = (vulns.critical || 0) + (vulns.high || 0);
          report.findings.push({
            type: 'npm-audit',
            severity: critical > 0 ? 'high' : total > 0 ? 'medium' : 'info',
            message: `npm audit: ${total} vulnerabilities (${vulns.critical || 0} critical, ${vulns.high || 0} high)`,
            detail: vulns,
          });
          report.score -= critical * 10;
          report.score -= (total - critical) * 2;
        }
      } catch (_) {
        report.findings.push({ type: 'npm-audit', severity: 'warn', message: 'Could not parse npm audit output.' });
      }
    }

    // 2. Check for CSP header in server.js / app.js
    const serverFiles = ['server.js', 'app.js', 'index.js'].map(f => path.join(cwd, f)).filter(f => fs.existsSync(f));
    let cspFound = false;
    let helmetFound = false;
    for (const file of serverFiles) {
      const src = fs.readFileSync(file, 'utf8');
      if (/content-security-policy/i.test(src)) cspFound = true;
      if (/helmet/i.test(src)) helmetFound = true;
    }
    if (!cspFound && !helmetFound) {
      report.findings.push({ type: 'csp', severity: 'medium', message: 'No CSP / Helmet middleware detected in server files.' });
      report.score -= 10;
    } else {
      report.findings.push({ type: 'csp', severity: 'info', message: 'CSP / Helmet middleware detected.' });
    }

    // 3. Scan JS/HTML for common XSS patterns (innerHTML without sanitisation)
    const srcDir = path.join(cwd, 'public');
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js') || f.endsWith('.html'));
      for (const file of files) {
        const src = fs.readFileSync(path.join(srcDir, file), 'utf8');
        if (/innerHTML\s*=\s*[^;]+(?:req|param|user|input|query)/i.test(src)) {
          report.findings.push({ type: 'xss', severity: 'high', message: `Potential XSS via innerHTML in ${file}` });
          report.score -= 15;
        }
      }
    }

    // 4. Check for CSRF token in forms
    const publicDir = path.join(cwd, 'public');
    if (fs.existsSync(publicDir)) {
      const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
      for (const file of htmlFiles) {
        const src = fs.readFileSync(path.join(publicDir, file), 'utf8');
        const hasForms = /<form/i.test(src);
        const hasCsrf = /csrf|_token/i.test(src);
        if (hasForms && !hasCsrf) {
          report.findings.push({ type: 'csrf', severity: 'medium', message: `Form without CSRF token in ${file}` });
          report.score -= 5;
        }
      }
    }

    report.score = Math.max(0, Math.min(100, report.score));
    this._emit('report', report);
    return report;
  }
}

module.exports = new SecAgent();
