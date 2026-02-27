'use strict';
/**
 * Tests for the agent modules (BaseAgent lifecycle, ChatAgent, AnalyticsAgent).
 */
const BaseAgent = require('../agents/BaseAgent');
const AnalyticsAgent = require('../agents/AnalyticsAgent');
const ChatAgent = require('../agents/ChatAgent');

// ── BaseAgent ──────────────────────────────────────────────────────────────
class MockAgent extends BaseAgent {
  constructor() { super('MockAgent'); }
  async _execute(ctx) { return { ok: true, ctx }; }
}

test('BaseAgent: initial status is idle', () => {
  const a = new MockAgent();
  expect(a.status).toBe('idle');
});

test('BaseAgent: run() returns result and sets lastRun', async () => {
  const a = new MockAgent();
  const result = await a.run({ foo: 'bar' });
  expect(result.ok).toBe(true);
  expect(a.lastRun).toBeTruthy();
  expect(a.status).toBe('idle');
});

test('BaseAgent: toJSON() returns serialisable snapshot', () => {
  const a = new MockAgent();
  const json = a.toJSON();
  expect(json).toHaveProperty('name', 'MockAgent');
  expect(json).toHaveProperty('status');
  expect(json).toHaveProperty('id');
});

// ── AnalyticsAgent ─────────────────────────────────────────────────────────
test('AnalyticsAgent: recordRequest updates metrics', () => {
  const initial = AnalyticsAgent.getMetrics().requestCount;
  AnalyticsAgent.recordRequest(50, false);
  AnalyticsAgent.recordRequest(100, true);
  const m = AnalyticsAgent.getMetrics();
  expect(m.requestCount).toBe(initial + 2);
  expect(m.errorCount).toBeGreaterThanOrEqual(1);
  expect(m.avgResponseMs).toBeGreaterThan(0);
});

test('AnalyticsAgent: run() returns metrics object', async () => {
  const result = await AnalyticsAgent.run();
  expect(result).toHaveProperty('requestCount');
  expect(result).toHaveProperty('uptime');
});

// ── ChatAgent ──────────────────────────────────────────────────────────────
test('ChatAgent: offline stub returns reply', async () => {
  const result = await ChatAgent.run({ sessionId: 'test-s1', message: 'Hello', model: 'gpt-4', apiKey: null });
  expect(result).toHaveProperty('reply');
  expect(result.reply).toContain('offline');
});

test('ChatAgent: getHistory returns stored messages', async () => {
  await ChatAgent.run({ sessionId: 'test-s2', message: 'Ping', model: 'gpt-4', apiKey: null });
  const history = ChatAgent.getHistory('test-s2');
  expect(history.length).toBeGreaterThanOrEqual(2); // user + assistant
  expect(history[0].role).toBe('user');
  expect(history[0].content).toBe('Ping');
});

test('ChatAgent: clearSession removes history', async () => {
  await ChatAgent.run({ sessionId: 'test-s3', message: 'Hi', model: 'gpt-4', apiKey: null });
  ChatAgent.clearSession('test-s3');
  expect(ChatAgent.getHistory('test-s3').length).toBe(0);
});
