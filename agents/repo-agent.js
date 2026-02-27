/**
 * DRAGON-IA RepoAgent
 * Analyzes repositories, generates patch proposals and reports.
 */
"use strict";

const BaseAgent = require("./base-agent");

class RepoAgent extends BaseAgent {
  constructor(options = {}) {
    super("Repo-Agent", options);
    this.repoHistory = [];
  }

  async analyzeRepo(repoData) {
    this.setStatus("running");
    this.log("info", `Analyzing repository: ${repoData.name || "unknown"}`);

    const issues = [];
    const patches = [];

    if (repoData.files) {
      for (const file of repoData.files) {
        if (file.name && file.name.endsWith(".js") && file.content) {
          if (file.content.includes("eval(")) {
            issues.push({ file: file.name, severity: "high", msg: "eval() usage detected" });
            patches.push({ file: file.name, suggestion: "Replace eval() with safe alternatives" });
          }
          if (file.content.includes("console.log") && repoData.env === "production") {
            issues.push({ file: file.name, severity: "low", msg: "console.log in production" });
          }
        }
      }
    }

    const report = {
      repo: repoData.name,
      timestamp: new Date().toISOString(),
      issues,
      patches,
      score: Math.max(0, 100 - issues.length * 10)
    };

    this.repoHistory.push(report);
    this.log("info", `Analysis complete. Issues: ${issues.length}, Score: ${report.score}`);
    this.setStatus("idle");
    this.emit("report", report);
    return report;
  }

  getHistory() {
    return this.repoHistory.slice(-10);
  }
}

module.exports = RepoAgent;
