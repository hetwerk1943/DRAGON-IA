'use strict';
/**
 * ChatAgent – handles AI chat queries.
 * Supports multiple model backends: OpenAI GPT, stub (offline).
 * Stores encrypted conversation history in memory.
 */
const BaseAgent = require('./BaseAgent');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'DRAGON-IA-default-key-change-me!';

class ChatAgent extends BaseAgent {
  constructor() {
    super('ChatAgent');
    this._sessions = {}; // sessionId -> { role, messages: [] }
  }

  /** Encrypt a string with AES-256 (CBC). */
  _encrypt(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  /** Decrypt a previously encrypted string. */
  _decrypt(cipherText) {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /** Initialise or return an existing session. */
  getSession(sessionId, role = 'user') {
    if (!this._sessions[sessionId]) {
      this._sessions[sessionId] = { role, messages: [] };
    }
    return this._sessions[sessionId];
  }

  /** Return decrypted message history for a session. */
  getHistory(sessionId) {
    const session = this._sessions[sessionId];
    if (!session) return [];
    return session.messages.map(m => ({
      role: m.role,
      content: this._decrypt(m.encryptedContent),
      ts: m.ts,
    }));
  }

  /** Clear a session's history. */
  clearSession(sessionId) {
    delete this._sessions[sessionId];
  }

  async _execute({ sessionId = 'default', message, model = 'gpt-4', role = 'user', apiKey } = {}) {
    const session = this.getSession(sessionId, role);

    // Store user message (encrypted)
    session.messages.push({ role: 'user', encryptedContent: this._encrypt(message || ''), ts: Date.now() });

    let reply = '';

    if (apiKey && model.startsWith('gpt')) {
      // OpenAI API call
      try {
        const fetch = (await import('node-fetch')).default;
        const history = this.getHistory(sessionId).map(m => ({ role: m.role, content: m.content }));
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: 'You are DRAGON-IA, an advanced AI assistant.' }, ...history],
          }),
        });
        if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
        const data = await resp.json();
        reply = data.choices[0].message.content;
      } catch (err) {
        reply = `[ChatAgent error] ${err.message}`;
      }
    } else {
      // Offline stub reply
      reply = `[DRAGON-IA offline] Received: "${message}". Configure OPENAI_API_KEY in .env for live responses.`;
    }

    // Store assistant reply (encrypted)
    session.messages.push({ role: 'assistant', encryptedContent: this._encrypt(reply), ts: Date.now() });

    // Keep last 100 messages per session
    if (session.messages.length > 100) session.messages = session.messages.slice(-100);

    const result = { sessionId, model, reply, ts: new Date().toISOString() };
    this._emit('reply', result);
    return result;
  }
}

module.exports = new ChatAgent();
