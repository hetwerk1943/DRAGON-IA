/**
 * DRAGON-IA Agent Tests
 */
"use strict";

const BaseAgent = require("../agents/base-agent");
const RepoAgent = require("../agents/repo-agent");
const TestAgent = require("../agents/test-agent");
const SecAgent = require("../agents/sec-agent");
const AnalyticsAgent = require("../agents/analytics-agent");
const ChatAgent = require("../agents/chat-agent");

// ── BaseAgent ─────────────────────────────────────────────────────────────────
describe("BaseAgent", () => {
  test("initializes with idle status", () => {
    const agent = new BaseAgent("test");
    expect(agent.status).toBe("idle");
    expect(agent.name).toBe("test");
  });

  test("setStatus updates status and emits event", () => {
    const agent = new BaseAgent("test");
    const statuses = [];
    agent.on("status", s => statuses.push(s.status));
    agent.setStatus("running");
    expect(agent.status).toBe("running");
    expect(statuses).toContain("running");
  });

  test("log stores entries and emits log event", () => {
    const agent = new BaseAgent("logger");
    const entries = [];
    agent.on("log", e => entries.push(e));
    agent.log("info", "hello");
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe("hello");
  });

  test("getReport returns summary", () => {
    const agent = new BaseAgent("reporter");
    agent.log("info", "test msg");
    const report = agent.getReport();
    expect(report.agent).toBe("reporter");
    expect(report.status).toBe("idle");
  });
});

// ── RepoAgent ─────────────────────────────────────────────────────────────────
describe("RepoAgent", () => {
  test("analyzes repo and returns score", async () => {
    const agent = new RepoAgent();
    const report = await agent.analyzeRepo({ name: "my-repo", files: [] });
    expect(report.score).toBe(100);
    expect(report.issues).toHaveLength(0);
  });

  test("detects eval() usage", async () => {
    const agent = new RepoAgent();
    const report = await agent.analyzeRepo({
      name: "evil-repo",
      files: [{ name: "app.js", content: "eval('bad')" }]
    });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues[0].severity).toBe("high");
    expect(report.score).toBeLessThan(100);
  });

  test("stores history", async () => {
    const agent = new RepoAgent();
    await agent.analyzeRepo({ name: "r1", files: [] });
    await agent.analyzeRepo({ name: "r2", files: [] });
    expect(agent.getHistory().length).toBe(2);
  });
});

// ── TestAgent ─────────────────────────────────────────────────────────────────
describe("TestAgent", () => {
  test("validates correct JSON", async () => {
    const agent = new TestAgent();
    const result = await agent.runJsonLint("{\"key\":\"value\"}", "test.json");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("flags invalid JSON", async () => {
    const agent = new TestAgent();
    const result = await agent.runJsonLint("{\"bad\": true, }", "bad.json");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("node-check passes clean code", async () => {
    const agent = new TestAgent();
    const result = await agent.runNodeCheck("console.log('hello');", "clean.js");
    expect(result.passed).toBe(true);
  });

  test("node-check flags child_process", async () => {
    const agent = new TestAgent();
    const result = await agent.runNodeCheck("const cp = require('child_process');", "risky.js");
    expect(result.passed).toBe(false);
  });
});

// ── SecAgent ──────────────────────────────────────────────────────────────────
describe("SecAgent", () => {
  test("detects missing CSP", () => {
    const agent = new SecAgent();
    const finding = agent.scanHtml("<html><head></head><body></body></html>");
    const cspIssue = finding.issues.find(i => i.type === "CSP");
    expect(cspIssue).toBeDefined();
  });

  test("detects javascript: URI (XSS)", () => {
    const agent = new SecAgent();
    const finding = agent.scanHtml("<a href=\"javascript:alert(1)\">click</a>");
    const xssIssue = finding.issues.find(i => i.type === "XSS");
    expect(xssIssue).toBeDefined();
    expect(xssIssue.severity).toBe("critical");
  });

  test("score decreases with issues", () => {
    const agent = new SecAgent();
    const cleanFinding = agent.scanHtml("<html><head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'\" /></head><body></body></html>");
    expect(cleanFinding.score).toBe(100);
  });

  test("dependency scan flags known risky package", () => {
    const agent = new SecAgent();
    const result = agent.scanDependencies(["lodash@3.10.1", "express@4.18.2"]);
    expect(result.flagged.length).toBeGreaterThan(0);
  });
});

// ── AnalyticsAgent ─────────────────────────────────────────────────────────────
describe("AnalyticsAgent", () => {
  test("records metrics", () => {
    const agent = new AnalyticsAgent();
    const m = agent.recordMetric("page-load", 250, "ms");
    expect(m.name).toBe("page-load");
    expect(m.value).toBe(250);
  });

  test("uptime increases over time", (done) => {
    const agent = new AnalyticsAgent();
    setTimeout(() => {
      expect(agent.getUptime()).toBeGreaterThanOrEqual(0);
      done();
    }, 10);
  });

  test("getSummary returns correct shape", () => {
    const agent = new AnalyticsAgent();
    agent.recordMetric("x", 1);
    const summary = agent.getSummary();
    expect(summary.agent).toBe("Analytics-Agent");
    expect(summary.metricsCount).toBe(1);
  });

  test("error recording increments count", () => {
    const agent = new AnalyticsAgent();
    agent.recordError("test error");
    expect(agent.errorCount).toBe(1);
  });
});

// ── ChatAgent ─────────────────────────────────────────────────────────────────
describe("ChatAgent", () => {
  test("creates session", () => {
    const agent = new ChatAgent();
    const session = agent.createSession("s1", "admin");
    expect(session.id).toBe("s1");
    expect(session.role).toBe("admin");
  });

  test("returns existing session on duplicate create", () => {
    const agent = new ChatAgent();
    agent.createSession("s2");
    const s2 = agent.createSession("s2");
    expect(s2.id).toBe("s2");
    expect(agent.getSessions().length).toBe(1);
  });

  test("adds messages to history", () => {
    const agent = new ChatAgent();
    agent.addMessage("s3", "user", "Hello");
    const history = agent.getHistory("s3");
    expect(history.length).toBe(1);
    expect(history[0].content).toBe("Hello");
  });

  test("respond generates assistant reply", async () => {
    const agent = new ChatAgent();
    const reply = await agent.respond("s4", "test message", "gpt-4");
    expect(reply).toContain("test message");
    const history = agent.getHistory("s4");
    expect(history.length).toBe(2);
  });

  test("falls back to gpt-4 for unknown model", async () => {
    const agent = new ChatAgent();
    const reply = await agent.respond("s5", "hi", "unknown-model");
    expect(reply).toContain("[gpt-4]");
  });
});
