/**
 * DRAGON-IA TestAgent
 * Runs lints, node-checks and jsonlint validations.
 */
"use strict";

const BaseAgent = require("./base-agent");

class TestAgent extends BaseAgent {
  constructor(options = {}) {
    super("Test-Agent", options);
    this.results = [];
  }

  async runJsonLint(jsonString, label = "input") {
    this.setStatus("running");
    this.log("info", `Running JSON lint on: ${label}`);
    let result;
    try {
      JSON.parse(jsonString);
      result = { label, valid: true, errors: [] };
      this.log("info", `${label}: JSON valid`);
    } catch (err) {
      result = { label, valid: false, errors: [err.message] };
      this.log("warn", `${label}: JSON invalid – ${err.message}`);
    }
    this.results.push({ ...result, timestamp: new Date().toISOString() });
    this.setStatus("idle");
    this.emit("result", result);
    return result;
  }

  async runNodeCheck(code, label = "snippet") {
    this.setStatus("running");
    this.log("info", `Running node-check on: ${label}`);
    const issues = [];

    if (typeof code === "string") {
      if (code.includes("require(\"child_process\")") || code.includes("require('child_process')")) {
        issues.push("child_process usage – review carefully");
      }
      if (/new\s+Function\s*\(/.test(code)) {
        issues.push("new Function() usage – potential code injection");
      }
    }

    const result = { label, issues, passed: issues.length === 0 };
    this.results.push({ ...result, timestamp: new Date().toISOString() });
    this.log(issues.length ? "warn" : "info", `Node-check ${result.passed ? "PASSED" : "FAILED"}: ${issues.join("; ") || "OK"}`);
    this.setStatus("idle");
    this.emit("result", result);
    return result;
  }

  getResults() {
    return this.results.slice(-20);
  }
}

module.exports = TestAgent;
