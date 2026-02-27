'use strict';

require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const Orchestrator = require('./orchestrator');
const createApiRouter = require('./routes/api');
const createChatRouter = require('./routes/chat');

const app = express();
const orchestrator = new Orchestrator();

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      connectSrc: ['\'self\'', 'wss:', 'ws:'],
      imgSrc: ['\'self\'', 'data:'],
    },
  },
}));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Static files (PWA) ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api', apiLimiter, createApiRouter(orchestrator));
app.use('/chat', chatLimiter, createChatRouter(orchestrator));

// ── Catch-all: serve index.html for SPA ───────────────────────────────────
app.get('*', staticLimiter, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── HTTP server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// ── WebSocket server ───────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  console.log(`[WS] Client connected: ${clientId}`);

  // Send initial status on connect
  ws.send(JSON.stringify({ type: 'connected', clientId, statuses: orchestrator.getStatuses() }));

  // Forward orchestrator events to all connected clients
  const onReport = (payload) => broadcast({ type: 'report', payload });
  const onError  = (payload) => broadcast({ type: 'agent-error', payload });
  const onChat   = (payload) => broadcast({ type: 'chat', payload });
  orchestrator.on('report', onReport);
  orchestrator.on('error',  onError);
  orchestrator.on('chat',   onChat);

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'run-all':
        orchestrator.runAll(msg.payload || {}).catch(console.error);
        break;
      case 'chat':
        orchestrator.agents.chat
          .chat(msg.sessionId || clientId, msg.message, msg.options || {})
          .catch(console.error);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    orchestrator.off('report', onReport);
    orchestrator.off('error',  onError);
    orchestrator.off('chat',   onChat);
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) client.send(msg);
  }
}

server.listen(PORT, () => {
  console.log(`[DRAGON-IA] Server running on http://localhost:${PORT}`);
  console.log('[DRAGON-IA] Agents: repo, test, sec, analytics, chat');
});

// Export for testing
module.exports = { app, server, orchestrator };
