'use strict';

const request = require('supertest');

// Prevent the server from actually listening during tests
jest.mock('../server/index', () => {
  const Orchestrator = require('../server/orchestrator');
  const express = require('express');
  const helmet = require('helmet');
  const cors = require('cors');
  const path = require('path');
  const createApiRouter = require('../server/routes/api');
  const createChatRouter = require('../server/routes/chat');

  const app = express();
  const orchestrator = new Orchestrator();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', createApiRouter(orchestrator));
  app.use('/chat', createChatRouter(orchestrator));

  return { app, orchestrator };
});

const { app } = require('../server/index');

describe('GET /api/status', () => {
  test('returns ok and statuses', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.statuses).toBeDefined();
  });
});

describe('GET /api/dashboard', () => {
  test('returns dashboard shape', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('agentStatuses');
    expect(res.body).toHaveProperty('recentReports');
  });
});

describe('POST /api/repo', () => {
  test('analyzes empty payload', async () => {
    const res = await request(app).post('/api/repo').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.report).toHaveProperty('findings');
  });

  test('returns score for clean files', async () => {
    const res = await request(app).post('/api/repo').send({
      files: [{ name: 'index.js', content: 'const x = 1;' }],
    });
    expect(res.body.report.score).toBe(100);
  });
});

describe('POST /api/sec', () => {
  test('flags missing CSP', async () => {
    const res = await request(app).post('/api/sec').send({ headers: {} });
    expect(res.status).toBe(200);
    expect(res.body.report.cspValid).toBe(false);
  });
});

describe('POST /api/analyze', () => {
  test('returns all agent reports', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveProperty('repoReport');
    expect(res.body.results).toHaveProperty('secReport');
    expect(res.body.results).toHaveProperty('testReport');
    expect(res.body.results).toHaveProperty('analyticsReport');
  });
});

describe('POST /chat/message', () => {
  test('requires sessionId and message', async () => {
    const res = await request(app).post('/chat/message').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('returns reply for local model', async () => {
    const res = await request(app).post('/chat/message').send({
      sessionId: 'test-session',
      message: 'Hello',
      model: 'local',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.reply).toBeDefined();
  });
});

describe('GET /chat/sessions', () => {
  test('returns sessions array', async () => {
    const res = await request(app).get('/chat/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });
});

describe('GET /chat/history/:sessionId', () => {
  test('returns 404 for unknown session', async () => {
    const res = await request(app).get('/chat/history/nonexistent-sess');
    expect(res.status).toBe(404);
  });
});
