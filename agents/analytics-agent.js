/**
 * DRAGON-IA AnalyticsAgent
 * Measures performance, uptime and JS error rates.
 */
"use strict";

const BaseAgent = require("./base-agent");

class AnalyticsAgent extends BaseAgent {
  constructor(options = {}) {
    super("Analytics-Agent", options);
    this.metrics = [];
    this.startTime = Date.now();
    this.errorCount = 0;
  }

  recordMetric(name, value, unit = "") {
    const metric = { name, value, unit, timestamp: new Date().toISOString() };
    this.metrics.push(metric);
    if (this.metrics.length > 1000) this.metrics.shift();
    this.log("info", `Metric recorded: ${name}=${value}${unit}`);
    this.emit("metric", metric);
    return metric;
  }

  recordError(message, stack = "") {
    this.errorCount++;
    this.log("warn", `JS Error #${this.errorCount}: ${message}`);
    this.emit("error-event", { message, stack, count: this.errorCount });
  }

  getUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getSummary() {
    const uptime = this.getUptime();
    const recent = this.metrics.slice(-50);
    return {
      agent: this.name,
      uptime,
      errorCount: this.errorCount,
      metricsCount: this.metrics.length,
      recentMetrics: recent,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AnalyticsAgent;
