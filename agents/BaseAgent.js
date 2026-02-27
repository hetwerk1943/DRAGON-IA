'use strict';
/**
 * BaseAgent – common lifecycle management for all DRAGON-IA agents.
 */
const bus = require('./EventBus');
const { v4: uuidv4 } = require('uuid');

class BaseAgent {
  constructor(name) {
    this.id = uuidv4();
    this.name = name;
    this.status = 'idle'; // idle | running | error
    this.lastRun = null;
    this.lastResult = null;
  }

  /** Emit an agent-scoped event on the shared bus. */
  _emit(channel, payload) {
    bus.emit(`${this.name}:${channel}`, { agentId: this.id, agentName: this.name, ...payload });
  }

  /** Update status and broadcast it. */
  _setStatus(status) {
    this.status = status;
    bus.emit('agent:status', { agentId: this.id, agentName: this.name, status });
  }

  /** Run the agent's task, with lifecycle hooks. */
  async run(ctx = {}) {
    this._setStatus('running');
    try {
      this.lastResult = await this._execute(ctx);
      this.lastRun = new Date().toISOString();
      this._setStatus('idle');
      return this.lastResult;
    } catch (err) {
      this._setStatus('error');
      this._emit('error', { message: err.message });
      throw err;
    }
  }

  /** Override in subclass. */
  async _execute(_ctx) {
    throw new Error(`${this.name}._execute() not implemented`);
  }

  /** Serialisable snapshot for the dashboard. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      lastRun: this.lastRun,
      lastResult: this.lastResult,
    };
  }
}

module.exports = BaseAgent;
