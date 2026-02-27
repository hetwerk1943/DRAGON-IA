'use strict';
/**
 * DRAGON-IA – Main Express + Socket.io server.
 *
 * Architecture:
 *   - REST API  : /api/agents/*  (run agents, fetch results)
 *   - WebSocket : real-time agent status & chat via Socket.io
 *   - Static    : /public  (dashboard + PWA)
 *   - Security  : Helmet (CSP), CORS, rate-limiting
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const bus = require('./agents/EventBus');
const repoAgent = require('./agents/RepoAgent');
const testAgent = require('./agents/TestAgent');
const secAgent = require('./agents/SecAgent');
const analyticsAgent = require('./agents/AnalyticsAgent');
const chatAgent = require('./agents/ChatAgent');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// ──────────────────────────────────────────────
// Security middleware
// ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// Analytics request recorder
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    analyticsAgent.recordRequest(Date.now() - start, res.statusCode >= 500);
  });
  next();
});

// ──────────────────────────────────────────────
// REST API routes
// ──────────────────────────────────────────────

/** GET /api/agents – list all agents and their status. */
app.get('/api/agents', (_req, res) => {
  res.json([repoAgent, testAgent, secAgent, analyticsAgent, chatAgent].map(a => a.toJSON()));
});

/** POST /api/agents/repo/run – trigger RepoAgent. */
app.post('/api/agents/repo/run', async (req, res) => {
  try {
    const result = await repoAgent.run({ repoUrl: req.body.repoUrl, token: process.env.GITHUB_TOKEN });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/agents/test/run – trigger TestAgent. */
app.post('/api/agents/test/run', async (req, res) => {
  try {
    const result = await testAgent.run({ projectPath: req.body.projectPath });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/agents/sec/run – trigger SecAgent. */
app.post('/api/agents/sec/run', async (req, res) => {
  try {
    const result = await secAgent.run({ projectPath: req.body.projectPath });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/agents/analytics – return current metrics. */
app.get('/api/agents/analytics', async (_req, res) => {
  try {
    const result = await analyticsAgent.run();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/chat – send a message to ChatAgent. */
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, model, role } = req.body;
    const result = await chatAgent.run({
      sessionId,
      message,
      model: model || process.env.DEFAULT_MODEL || 'gpt-4',
      role: role || 'user',
      apiKey: process.env.OPENAI_API_KEY,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/chat/history/:sessionId – retrieve chat history. */
app.get('/api/chat/history/:sessionId', (req, res) => {
  const history = chatAgent.getHistory(req.params.sessionId);
  res.json(history);
});

/** DELETE /api/chat/history/:sessionId – clear a session. */
app.delete('/api/chat/history/:sessionId', (req, res) => {
  chatAgent.clearSession(req.params.sessionId);
  res.json({ cleared: true });
});

/** GET /api/events – last 50 bus events (audit log). */
app.get('/api/events', (_req, res) => {
  res.json(bus.getHistory(50));
});

// ──────────────────────────────────────────────
// WebSocket – bridge bus events to connected clients
// ──────────────────────────────────────────────
bus.on('agent:status', (payload) => io.emit('agent:status', payload));
['RepoAgent', 'TestAgent', 'SecAgent', 'AnalyticsAgent', 'ChatAgent'].forEach(name => {
  bus.on(`${name}:report`, (p) => io.emit('agent:event', { agent: name, type: 'report', payload: p }));
  bus.on(`${name}:result`, (p) => io.emit('agent:event', { agent: name, type: 'result', payload: p }));
  bus.on(`${name}:metrics`, (p) => io.emit('agent:event', { agent: name, type: 'metrics', payload: p }));
  bus.on(`${name}:reply`, (p) => io.emit('agent:event', { agent: name, type: 'reply', payload: p }));
  bus.on(`${name}:error`, (p) => io.emit('agent:event', { agent: name, type: 'error', payload: p }));
});

io.on('connection', (socket) => {
  console.log(`[WS] client connected: ${socket.id}`);
  // Send current agent statuses on connect
  socket.emit('agent:list', [repoAgent, testAgent, secAgent, analyticsAgent, chatAgent].map(a => a.toJSON()));

  socket.on('chat:message', async (data) => {
    try {
      const result = await chatAgent.run({
        sessionId: data.sessionId || socket.id,
        message: data.message,
        model: data.model || process.env.DEFAULT_MODEL || 'gpt-4',
        role: data.role || 'user',
        apiKey: process.env.OPENAI_API_KEY,
      });
      socket.emit('chat:reply', result);
    } catch (err) {
      socket.emit('chat:error', { message: err.message });
    }
  });

  socket.on('disconnect', () => console.log(`[WS] client disconnected: ${socket.id}`));
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`DRAGON-IA running on http://localhost:${PORT}`));
}

module.exports = { app, server, io };
