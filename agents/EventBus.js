'use strict';
/**
 * EventBus – lightweight in-process publish/subscribe event queue.
 * Agents communicate via named channels without direct coupling.
 */
class EventBus {
  constructor() {
    this._handlers = {};
    this._history = [];
  }

  /** Subscribe to a channel. Returns an unsubscribe function. */
  on(channel, handler) {
    if (!this._handlers[channel]) this._handlers[channel] = [];
    this._handlers[channel].push(handler);
    return () => this.off(channel, handler);
  }

  /** Unsubscribe a handler from a channel. */
  off(channel, handler) {
    if (!this._handlers[channel]) return;
    this._handlers[channel] = this._handlers[channel].filter(h => h !== handler);
  }

  /** Publish an event to a channel. Handlers are invoked asynchronously. */
  emit(channel, payload) {
    const event = { channel, payload, ts: Date.now() };
    this._history.push(event);
    if (this._history.length > 500) this._history.shift();
    const handlers = this._handlers[channel] || [];
    handlers.forEach(h => setImmediate(() => h(payload)));
  }

  /** Return recent event history (last N entries across all channels). */
  getHistory(n = 50) {
    return this._history.slice(-n);
  }
}

module.exports = new EventBus();
