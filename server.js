'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ── OpenAI (optional) ────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY?.trim()) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const PORT  = process.env.PORT  || 3000;
const MODEL = process.env.MODEL || 'gpt-4o-mini';

// ── Paths ─────────────────────────────────────────────────────────────────────
const DATA_DIR     = path.join(__dirname, 'data');
const LOGS_DIR     = path.join(__dirname, 'logs');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const REQUESTS_FILE = path.join(LOGS_DIR, 'requests.json');

[DATA_DIR, LOGS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── In-memory session store ───────────────────────────────────────────────────
const sessions = new Map();

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      Object.entries(raw).forEach(([k, v]) => sessions.set(k, v));
    }
  } catch (err) {
    console.warn('Warning: sessions file is corrupt, starting fresh:', err.message);
  }
}

function saveSessions() {
  const obj = {};
  sessions.forEach((v, k) => { obj[k] = v; });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
}

loadSessions();

// ── Request logger ────────────────────────────────────────────────────────────
function logRequest(entry) {
  let logs = [];
  try { if (fs.existsSync(REQUESTS_FILE)) logs = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch { /* */ }
  logs.push({ ...entry, ts: new Date().toISOString() });
  if (logs.length > 1000) logs = logs.slice(-1000);
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(logs, null, 2));
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, _res, next) => {
  logRequest({ method: req.method, path: req.path, ip: req.ip });
  next();
});

// ── WebSocket broadcast ───────────────────────────────────────────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'connected', message: 'DRAGON-IA WebSocket ready' }));
});

// ── Agents ────────────────────────────────────────────────────────────────────
const agentManager = require('./agents/index');
agentManager.setBroadcast(broadcast);

// ── Helper: get or create session ─────────────────────────────────────────────
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { id: sessionId, messages: [], createdAt: new Date().toISOString() });
  }
  return sessions.get(sessionId);
}

// ── Mock AI response ──────────────────────────────────────────────────────────
function mockResponse(prompt) {
  const responses = [
    `I received your message: "${prompt}". This is a mock response — set OPENAI_API_KEY in .env to enable real AI responses.`,
    `Mock AI here! You asked about "${prompt}". Configure your OpenAI API key to get real answers.`,
    `[MOCK] Interesting question about "${prompt}". Add OPENAI_API_KEY to .env for live AI responses.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ── POST /chat ────────────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const { prompt, sessionId = uuidv4(), userId = 'anonymous' } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const session = getSession(sessionId);
  session.messages.push({ role: 'user', content: prompt, ts: new Date().toISOString() });

  let reply;
  try {
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: session.messages.map(m => ({ role: m.role, content: m.content })),
      });
      reply = completion.choices[0].message.content;
    } else {
      reply = mockResponse(prompt);
    }
  } catch (err) {
    console.error('OpenAI error:', err.message);
    reply = `Error contacting AI: ${err.message}. Falling back to mock.`;
  }

  session.messages.push({ role: 'assistant', content: reply, ts: new Date().toISOString() });
  saveSessions();

  res.json({ reply, sessionId, userId, model: openai ? MODEL : 'mock' });
});

// ── GET /chat/history/:sessionId ──────────────────────────────────────────────
app.get('/chat/history/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.json({ sessionId: req.params.sessionId, messages: [] });
  res.json({ sessionId: session.id, messages: session.messages });
});

// ── DELETE /chat/history/:sessionId ──────────────────────────────────────────
app.delete('/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.messages = [];
    saveSessions();
  }
  res.json({ ok: true, sessionId });
});

// ── POST /agents/run ──────────────────────────────────────────────────────────
app.post('/agents/run', async (req, res) => {
  const { agents: requested = ['repo', 'test', 'sec'] } = req.body;
  const runId = uuidv4();
  res.json({ ok: true, runId, agents: requested, status: 'started' });
  // run async after response
  agentManager.run(requested, runId).catch(err => console.error('Agent run error:', err));
});

// ── GET /agents/status ────────────────────────────────────────────────────────
app.get('/agents/status', (_req, res) => {
  res.json(agentManager.getStatus());
});

// ── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`DRAGON-IA server running on http://localhost:${PORT}`);
  console.log(`OpenAI: ${openai ? `enabled (${MODEL})` : 'disabled (mock mode)'}`);
});
