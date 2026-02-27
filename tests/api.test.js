'use strict';
/**
 * Integration tests for the Express REST API (server.js).
 */
const request = require('supertest');

let app, server, io;

beforeAll(() => {
  ({ app, server, io } = require('../server'));
});

afterAll((done) => {
  try { io.close(); } catch (_) { /* ignore */ }
  server.close(() => done());
});

test('GET /api/agents returns array of agents', async () => {
  const res = await request(app).get('/api/agents');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(5);
  const names = res.body.map(a => a.name);
  expect(names).toContain('RepoAgent');
  expect(names).toContain('SecAgent');
  expect(names).toContain('ChatAgent');
});

test('GET /api/agents/analytics returns metrics', async () => {
  const res = await request(app).get('/api/agents/analytics');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('requestCount');
  expect(res.body).toHaveProperty('uptime');
});

test('POST /api/chat returns offline reply', async () => {
  const res = await request(app)
    .post('/api/chat')
    .send({ sessionId: 'api-test', message: 'Hello DRAGON' });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('reply');
});

test('GET /api/chat/history/:sessionId returns messages', async () => {
  // Seed a message first
  await request(app).post('/api/chat').send({ sessionId: 'hist-test', message: 'Hi' });
  const res = await request(app).get('/api/chat/history/hist-test');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThanOrEqual(2);
});

test('DELETE /api/chat/history/:sessionId clears session', async () => {
  await request(app).post('/api/chat').send({ sessionId: 'del-test', message: 'bye' });
  const del = await request(app).delete('/api/chat/history/del-test');
  expect(del.status).toBe(200);
  expect(del.body.cleared).toBe(true);
  const hist = await request(app).get('/api/chat/history/del-test');
  expect(hist.body.length).toBe(0);
});

test('GET /api/events returns event log array', async () => {
  const res = await request(app).get('/api/events');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('POST /api/agents/test/run returns check results', async () => {
  const res = await request(app).post('/api/agents/test/run').send({});
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('checks');
  expect(Array.isArray(res.body.checks)).toBe(true);
});

test('POST /api/agents/sec/run returns security report', async () => {
  const res = await request(app).post('/api/agents/sec/run').send({});
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('findings');
  expect(res.body).toHaveProperty('score');
});

test('GET /agent.html serves the dashboard', async () => {
  const res = await request(app).get('/agent.html');
  expect(res.status).toBe(200);
  expect(res.text).toContain('DRAGON-IA');
});
