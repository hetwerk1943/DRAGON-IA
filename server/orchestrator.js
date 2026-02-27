'use strict';

const EventEmitter = require('events');
const RepoAgent = require('./agents/repo-agent');
const TestAgent = require('./agents/test-agent');
const SecAgent = require('./agents/sec-agent');
const AnalyticsAgent = require('./agents/analytics-agent');
const ChatAgent = require('./agents/chat-agent');

/**
 * Orchestrator – coordinates all agents, aggregates reports,
 * and routes events between agents and the WebSocket/REST layer.
 */
class Orchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = {
      repo: new RepoAgent(this),
      test: new TestAgent(this),
      sec: new SecAgent(this),
      analytics: new AnalyticsAgent(this),
      chat: new ChatAgent(this),
    };

    this._reports = [];
    this._maxReports = 500;

    this.on('report', (payload) => {
      this._storeReport(payload);
    });

    this.on('error', (payload) => {
      this.agents.analytics.recordEvent('error', { message: `Agent error [${payload.agent}]: ${payload.error}` });
    });

    this.on('chat', (payload) => {
      this.agents.analytics.recordEvent('chat', payload);
    });
  }

  /**
   * Run all agents with a unified payload.
   */
  async runAll(payload = {}) {
    const [repoReport, testReport, secReport, analyticsReport] = await Promise.all([
      this.agents.repo.analyze(payload),
      this.agents.test.run(payload),
      this.agents.sec.scan(payload),
      this.agents.analytics.report(payload),
    ]);

    return { repoReport, testReport, secReport, analyticsReport };
  }

  /**
   * Get status of all agents.
   */
  getStatuses() {
    return Object.fromEntries(
      Object.entries(this.agents).map(([name, agent]) => [name, agent.getStatus()])
    );
  }

  /**
   * Get aggregated dashboard data.
   */
  getDashboard() {
    const statuses = this.getStatuses();
    const recentReports = this._reports.slice(-20);
    return {
      timestamp: new Date().toISOString(),
      agentStatuses: statuses,
      recentReports,
      activeSessions: this.agents.chat.listSessions(),
    };
  }

  _storeReport(payload) {
    this._reports.push({ ...payload, storedAt: new Date().toISOString() });
    if (this._reports.length > this._maxReports) {
      this._reports.shift();
    }
  }

  getReports() {
    return this._reports;
  }
}

module.exports = Orchestrator;
