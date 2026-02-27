/**
 * DRAGON-IA SecAgent
 * Security scanning: CSP, XSS, CSRF, dependency checks.
 */
"use strict";

const BaseAgent = require("./base-agent");
const agentsConfig = require("../config/agents.json");

class SecAgent extends BaseAgent {
  constructor(options = {}) {
    super("Sec-Agent", options);
    this.findings = [];
    this.score = 100;
  }

  scanHtml(html, label = "document") {
    this.setStatus("running");
    this.log("info", `Scanning HTML for XSS/CSP issues: ${label}`);
    const issues = [];

    if (!/<meta[^>]+Content-Security-Policy/i.test(html)) {
      issues.push({ type: "CSP", severity: "high", msg: "Missing Content-Security-Policy meta tag" });
    }
    if (/javascript:/i.test(html)) {
      issues.push({ type: "XSS", severity: "critical", msg: "javascript: URI detected" });
    }
    if (/<script[^>]*src="http:/i.test(html)) {
      issues.push({ type: "XSS", severity: "medium", msg: "Insecure HTTP script source" });
    }
    if (!/<input[^>]*csrf/i.test(html) && /<form/i.test(html)) {
      issues.push({ type: "CSRF", severity: "high", msg: "Form without CSRF token field detected" });
    }

    const deduction = issues.reduce((s, i) => s + (i.severity === "critical" ? 30 : i.severity === "high" ? 20 : 10), 0);
    this.score = Math.max(0, 100 - deduction);
    const finding = { label, issues, score: this.score, timestamp: new Date().toISOString() };
    this.findings.push(finding);
    this.log(issues.length ? "warn" : "info", `Scan complete. Issues: ${issues.length}, Score: ${this.score}`);
    this.setStatus("idle");
    this.emit("finding", finding);
    return finding;
  }

  scanDependencies(deps = []) {
    this.setStatus("running");
    this.log("info", "Scanning dependency list for known risky packages");
    const flagged = [];
    const risky = agentsConfig.security.riskyDependencyPatterns;

    for (const dep of deps) {
      if (risky.some(r => dep.includes(r))) {
        flagged.push({ dep, msg: "Potentially vulnerable version" });
      }
    }

    this.log(flagged.length ? "warn" : "info", `Dependency scan done. Flagged: ${flagged.length}`);
    this.setStatus("idle");
    return { flagged };
  }

  getFindings() {
    return this.findings.slice(-20);
  }
}

module.exports = SecAgent;
