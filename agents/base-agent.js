/**
 * DRAGON-IA BaseAgent
 * Foundation class for all specialized agents.
 */
"use strict";

const { EventEmitter } = require("events");

class BaseAgent extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.status = "idle";
    this.logs = [];
    this.options = options;
  }

  log(level, message) {
    const entry = { ts: new Date().toISOString(), level, agent: this.name, message };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.emit("log", entry);
    console.log(`[${entry.ts}] [${level.toUpperCase()}] [${this.name}] ${message}`);
  }

  setStatus(status) {
    this.status = status;
    this.emit("status", { agent: this.name, status });
  }

  getReport() {
    return {
      agent: this.name,
      status: this.status,
      logs: this.logs.slice(-20),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseAgent;
