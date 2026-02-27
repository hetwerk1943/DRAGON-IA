'use strict';

const Orchestrator = require('../server/orchestrator');

describe('Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  test('initialises all five agents', () => {
    expect(orchestrator.agents.repo).toBeDefined();
    expect(orchestrator.agents.test).toBeDefined();
    expect(orchestrator.agents.sec).toBeDefined();
    expect(orchestrator.agents.analytics).toBeDefined();
    expect(orchestrator.agents.chat).toBeDefined();
  });

  test('getStatuses returns status for every agent', () => {
    const statuses = orchestrator.getStatuses();
    expect(statuses).toHaveProperty('repo');
    expect(statuses).toHaveProperty('test');
    expect(statuses).toHaveProperty('sec');
    expect(statuses).toHaveProperty('analytics');
    expect(statuses).toHaveProperty('chat');
  });

  test('getDashboard returns expected shape', () => {
    const dashboard = orchestrator.getDashboard();
    expect(dashboard).toHaveProperty('timestamp');
    expect(dashboard).toHaveProperty('agentStatuses');
    expect(dashboard).toHaveProperty('recentReports');
    expect(dashboard).toHaveProperty('activeSessions');
  });

  test('reports are stored and retrievable', (done) => {
    orchestrator.emit('report', { agent: 'repo', report: { score: 90 } });
    setImmediate(() => {
      const reports = orchestrator.getReports();
      expect(reports.length).toBeGreaterThan(0);
      expect(reports[0].agent).toBe('repo');
      done();
    });
  });
});

// ── RepoAgent ────────────────────────────────────────────────────────────────
describe('RepoAgent', () => {
  let orchestrator;

  beforeEach(() => { orchestrator = new Orchestrator(); });

  test('analyze returns report structure', async () => {
    const report = await orchestrator.agents.repo.analyze({});
    expect(report).toHaveProperty('agent', 'repo-agent');
    expect(report).toHaveProperty('findings');
    expect(report).toHaveProperty('patches');
  });

  test('detects eval() as critical', async () => {
    const report = await orchestrator.agents.repo.analyze({
      files: [{ name: 'test.js', content: 'eval("alert(1)")' }],
    });
    const critical = report.findings.filter(f => f.type === 'critical');
    expect(critical.length).toBeGreaterThan(0);
  });

  test('score is penalised for critical findings', async () => {
    const report = await orchestrator.agents.repo.analyze({
      files: [{ name: 'test.js', content: 'eval("bad")' }],
    });
    expect(report.score).toBeLessThan(100);
  });

  test('score is 100 for clean code', async () => {
    const report = await orchestrator.agents.repo.analyze({
      files: [{ name: 'clean.js', content: 'const x = 1;' }],
    });
    expect(report.score).toBe(100);
  });
});

// ── SecAgent ─────────────────────────────────────────────────────────────────
describe('SecAgent', () => {
  let orchestrator;

  beforeEach(() => { orchestrator = new Orchestrator(); });

  test('flags missing CSP header', async () => {
    const report = await orchestrator.agents.sec.scan({ headers: {} });
    const cspIssue = report.vulnerabilities.find(v => v.type === 'CSP');
    expect(cspIssue).toBeDefined();
    expect(report.cspValid).toBe(false);
  });

  test('accepts valid CSP', async () => {
    const report = await orchestrator.agents.sec.scan({
      headers: { 'content-security-policy': 'default-src \'self\'' },
    });
    expect(report.cspValid).toBe(true);
  });

  test('detects innerHTML XSS risk', async () => {
    const report = await orchestrator.agents.sec.scan({
      files: [{ name: 'app.js', content: 'el.innerHTML = userInput;' }],
    });
    expect(report.xssRisks.length).toBeGreaterThan(0);
  });

  test('security score decreases with high-severity findings', async () => {
    const report = await orchestrator.agents.sec.scan({
      headers: {},
      files: [{ name: 'bad.js', content: 'eval("x")' }],
    });
    expect(report.securityScore).toBeLessThan(100);
  });
});

// ── AnalyticsAgent ───────────────────────────────────────────────────────────
describe('AnalyticsAgent', () => {
  let orchestrator;

  beforeEach(() => { orchestrator = new Orchestrator(); });

  test('report contains uptimeHuman', async () => {
    const report = await orchestrator.agents.analytics.report({});
    expect(report).toHaveProperty('uptimeHuman');
    expect(typeof report.uptimeHuman).toBe('string');
  });

  test('recordEvent increments eventCount', async () => {
    orchestrator.agents.analytics.recordEvent('error', { message: 'test error' });
    const report = await orchestrator.agents.analytics.report({});
    expect(report.eventCount).toBeGreaterThan(0);
    expect(report.errorCount).toBeGreaterThan(0);
  });

  test('adSafeMode defaults to true', async () => {
    const report = await orchestrator.agents.analytics.report({});
    expect(report.adSafeMode).toBe(true);
  });
});

// ── ChatAgent ────────────────────────────────────────────────────────────────
describe('ChatAgent', () => {
  let orchestrator;

  beforeEach(() => { orchestrator = new Orchestrator(); });

  test('creates session on first chat', async () => {
    const result = await orchestrator.agents.chat.chat('sess1', 'Hello', { model: 'local' });
    expect(result).toHaveProperty('reply');
    expect(result.sessionId).toBe('sess1');
  });

  test('echo reply for local model', async () => {
    const result = await orchestrator.agents.chat.chat('sess2', 'ping', { model: 'local' });
    expect(result.reply).toContain('ping');
  });

  test('getEncryptedHistory returns encrypted string', async () => {
    await orchestrator.agents.chat.chat('sess3', 'hello', { model: 'local' });
    const enc = orchestrator.agents.chat.getEncryptedHistory('sess3');
    expect(typeof enc).toBe('string');
    expect(enc).toContain(':');
  });

  test('decrypt reverses encrypt', async () => {
    await orchestrator.agents.chat.chat('sess4', 'secret message', { model: 'local' });
    const enc = orchestrator.agents.chat.getEncryptedHistory('sess4');
    const dec = orchestrator.agents.chat.decrypt(enc);
    const history = JSON.parse(dec);
    expect(Array.isArray(history)).toBe(true);
    expect(history.some(h => h.content === 'secret message')).toBe(true);
  });

  test('listSessions returns active sessions', async () => {
    await orchestrator.agents.chat.chat('s-list-1', 'hi', { model: 'local' });
    await orchestrator.agents.chat.chat('s-list-2', 'yo', { model: 'local' });
    const list = orchestrator.agents.chat.listSessions();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('getEncryptedHistory returns null for unknown session', () => {
    const result = orchestrator.agents.chat.getEncryptedHistory('nonexistent');
    expect(result).toBeNull();
  });
});
