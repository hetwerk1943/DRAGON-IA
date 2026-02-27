/**
 * DRAGON-IA Server
 * Express + WebSocket backend orchestrating all agents.
 */
"use strict";

require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const agentsConfig = require("./config/agents.json");
const rateLimitConfig = agentsConfig.server.rateLimit;

const RepoAgent = require("./agents/repo-agent");
const TestAgent = require("./agents/test-agent");
const SecAgent = require("./agents/sec-agent");
const AnalyticsAgent = require("./agents/analytics-agent");
const ChatAgent = require("./agents/chat-agent");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ── Agents ──────────────────────────────────────────────────────────────────
const agents = {
  repo: new RepoAgent(),
  test: new TestAgent(),
  sec: new SecAgent(),
  analytics: new AnalyticsAgent(),
  chat: new ChatAgent()
};

// ── Broadcast helper ─────────────────────────────────────────────────────────
function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload, ts: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// Wire up agent events → WebSocket broadcast
Object.values(agents).forEach(agent => {
  agent.on("log", entry => broadcast("log", entry));
  agent.on("status", info => broadcast("status", info));
  agent.on("report", data => broadcast("report", data));
  agent.on("metric", m => broadcast("metric", m));
  agent.on("finding", f => broadcast("finding", f));
  agent.on("message", m => broadcast("chat-message", m));
  agent.on("response", r => broadcast("chat-response", r));
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(rateLimit({ windowMs: rateLimitConfig.windowMs, max: rateLimitConfig.max, standardHeaders: true, legacyHeaders: false }));

// ── Static HTML pages ─────────────────────────────────────────────────────────
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "agent.html")));

// ── REST API ─────────────────────────────────────────────────────────────────
app.get("/api/agents", (req, res) => {
  const summary = {};
  for (const [key, agent] of Object.entries(agents)) {
    summary[key] = agent.getReport ? agent.getReport() : { name: agent.name, status: agent.status };
  }
  res.json(summary);
});

app.post("/api/repo/analyze", async (req, res) => {
  try {
    const report = await agents.repo.analyzeRepo(req.body);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/test/json", async (req, res) => {
  try {
    const { jsonString, label } = req.body;
    const result = await agents.test.runJsonLint(jsonString, label);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/test/node", async (req, res) => {
  try {
    const { code, label } = req.body;
    const result = await agents.test.runNodeCheck(code, label);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sec/scan-html", (req, res) => {
  try {
    const { html, label } = req.body;
    const finding = agents.sec.scanHtml(html, label);
    res.json(finding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sec/scan-deps", (req, res) => {
  try {
    const { deps } = req.body;
    const result = agents.sec.scanDependencies(deps);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics", (req, res) => {
  res.json(agents.analytics.getSummary());
});

app.post("/api/analytics/metric", (req, res) => {
  const { name, value, unit } = req.body;
  const metric = agents.analytics.recordMetric(name, value, unit);
  res.json(metric);
});

app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId = "default", message, model = "gpt-4" } = req.body;
    const reply = await agents.chat.respond(sessionId, message, model);
    res.json({ reply, sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/chat/history/:sessionId", (req, res) => {
  res.json(agents.chat.getHistory(req.params.sessionId));
});

app.get("/api/chat/sessions", (req, res) => {
  res.json(agents.chat.getSessions());
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
wss.on("connection", (ws) => {
  agents.analytics.recordMetric("ws-connections", wss.clients.size, "");
  broadcast("status", { agent: "server", status: "client-connected", clients: wss.clients.size });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === "chat") {
        const { sessionId = "ws-default", message, model = "gpt-4" } = msg;
        const reply = await agents.chat.respond(sessionId, message, model);
        ws.send(JSON.stringify({ type: "chat-response", reply, sessionId }));
      } else if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: new Date().toISOString() }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: err.message }));
    }
  });

  ws.on("close", () => {
    broadcast("status", { agent: "server", status: "client-disconnected", clients: wss.clients.size });
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DRAGON-IA server running on http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});

module.exports = { app, server, agents };
