'use strict';

/**
 * AnalyticsAgent – measures performance, uptime, and JS errors.
 */
class AnalyticsAgent {
  constructor(orchestrator) {
    this.name = 'analytics-agent';
    this.orchestrator = orchestrator;
    this.status = 'idle';
    this._events = [];
    this._startTime = Date.now();
  }

  recordEvent(type, data = {}) {
    this._events.push({ type, data, ts: Date.now() });
  }

  async report(payload = {}) {
    this.status = 'running';
    const now = Date.now();
    const uptimeMs = now - this._startTime;

    const report = {
      agent: this.name,
      timestamp: new Date(now).toISOString(),
      uptimeMs,
      uptimeHuman: this._formatUptime(uptimeMs),
      eventCount: this._events.length,
      errorCount: this._events.filter(e => e.type === 'error').length,
      performanceMetrics: payload.metrics || {},
      topErrors: this._topErrors(),
      adSafeMode: payload.adSafeMode !== undefined ? payload.adSafeMode : true,
    };

    this.status = 'idle';
    this.orchestrator.emit('report', { agent: this.name, report });
    return report;
  }

  _formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
  }

  _topErrors() {
    const errorMap = {};
    for (const e of this._events.filter(ev => ev.type === 'error')) {
      const key = e.data.message || 'unknown';
      errorMap[key] = (errorMap[key] || 0) + 1;
    }
    return Object.entries(errorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  getStatus() {
    return { agent: this.name, status: this.status };
  }
}

module.exports = AnalyticsAgent;
