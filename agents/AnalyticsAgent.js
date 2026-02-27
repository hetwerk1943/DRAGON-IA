'use strict';
/**
 * AnalyticsAgent – tracks performance, uptime and JS error metrics.
 * Metrics are stored in memory and accessible via the dashboard.
 */
const BaseAgent = require('./BaseAgent');

class AnalyticsAgent extends BaseAgent {
  constructor() {
    super('AnalyticsAgent');
    this._metrics = {
      startTime: Date.now(),
      requestCount: 0,
      errorCount: 0,
      avgResponseMs: 0,
      _responseTimes: [],
      uptime: 0,
    };
  }

  /** Called by the Express middleware to record each request. */
  recordRequest(responseTimeMs, isError = false) {
    this._metrics.requestCount++;
    if (isError) this._metrics.errorCount++;
    this._metrics._responseTimes.push(responseTimeMs);
    if (this._metrics._responseTimes.length > 1000) this._metrics._responseTimes.shift();
    const sum = this._metrics._responseTimes.reduce((a, b) => a + b, 0);
    this._metrics.avgResponseMs = Math.round(sum / this._metrics._responseTimes.length);
  }

  getMetrics() {
    return {
      ...this._metrics,
      uptime: Math.floor((Date.now() - this._metrics.startTime) / 1000),
      _responseTimes: undefined,
    };
  }

  async _execute(_ctx) {
    const metrics = this.getMetrics();
    this._emit('metrics', metrics);
    return metrics;
  }
}

module.exports = new AnalyticsAgent();
