/**
 * DRAGON-IA ChatAgent
 * Handles real-time user queries and multi-model AI responses.
 */
"use strict";

const BaseAgent = require("./base-agent");

class ChatAgent extends BaseAgent {
  constructor(options = {}) {
    super("Chat-Agent", options);
    this.sessions = new Map();
    this.supportedModels = ["gpt-4", "claude", "llama", "local-llm"];
  }

  createSession(sessionId, role = "user") {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { id: sessionId, role, history: [], createdAt: new Date().toISOString() });
      this.log("info", `Session created: ${sessionId} (${role})`);
    }
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId, role, content) {
    const session = this.sessions.get(sessionId) || this.createSession(sessionId);
    const msg = { role, content, ts: new Date().toISOString() };
    session.history.push(msg);
    this.emit("message", { sessionId, msg });
    return msg;
  }

  async respond(sessionId, userMessage, model = "gpt-4") {
    this.setStatus("running");
    if (!this.supportedModels.includes(model)) {
      this.log("warn", `Unknown model: ${model}, falling back to gpt-4`);
      model = "gpt-4";
    }

    this.addMessage(sessionId, "user", userMessage);
    this.log("info", `[${model}] Processing message for session ${sessionId}`);

    // TODO: replace stub with actual API call to the configured AI provider via server
    const reply = `[${model}] Echo: ${userMessage}`;

    this.addMessage(sessionId, "assistant", reply);
    this.setStatus("idle");
    this.emit("response", { sessionId, model, reply });
    return reply;
  }

  getHistory(sessionId) {
    return this.sessions.get(sessionId)?.history || [];
  }

  getSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      role: s.role,
      messageCount: s.history.length,
      createdAt: s.createdAt
    }));
  }
}

module.exports = ChatAgent;
