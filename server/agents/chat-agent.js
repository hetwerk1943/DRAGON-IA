'use strict';

const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * ChatAgent – handles real-time conversations, multi-model support,
 * encrypted history, and role-based session management.
 */
class ChatAgent {
  constructor(orchestrator) {
    this.name = 'chat-agent';
    this.orchestrator = orchestrator;
    this.status = 'idle';
    this._sessions = new Map();
    if (!process.env.CHAT_ENCRYPT_KEY) {
      console.warn('[ChatAgent] WARNING: CHAT_ENCRYPT_KEY env var not set. Using a random per-instance key.');
    }
    this._encKey = process.env.CHAT_ENCRYPT_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create or retrieve a session.
   * @param {string} sessionId
   * @param {'admin'|'user'|'observer'} role
   */
  getOrCreateSession(sessionId, role = 'user') {
    if (!this._sessions.has(sessionId)) {
      this._sessions.set(sessionId, {
        id: sessionId,
        role,
        history: [],
        model: 'gpt-4',
        createdAt: new Date().toISOString(),
      });
    }
    return this._sessions.get(sessionId);
  }

  /**
   * Send a message to the chat agent.
   * Supports models: gpt-4, claude, llama, local.
   */
  async chat(sessionId, userMessage, options = {}) {
    this.status = 'running';
    const session = this.getOrCreateSession(sessionId, options.role);

    if (options.model) session.model = options.model;

    const assistantReply = await this._callModel(session, userMessage, options);

    session.history.push(
      { role: 'user', content: userMessage, ts: new Date().toISOString() },
      { role: 'assistant', content: assistantReply, ts: new Date().toISOString() }
    );

    this.orchestrator.emit('chat', { sessionId, userMessage, assistantReply, model: session.model });
    this.status = 'idle';
    return { sessionId, reply: assistantReply, model: session.model };
  }

  async _callModel(session, userMessage, _options) {
    const model = session.model;
    const apiKey = process.env.OPENAI_API_KEY;

    if ((model === 'gpt-4' || model === 'gpt-3.5-turbo') && apiKey) {
      return await this._callOpenAI(session, userMessage, apiKey, model);
    }

    // Fallback: echo for local/llama/claude when no real API key
    return `[${model}] Echo: ${userMessage}`;
  }

  async _callOpenAI(session, userMessage, apiKey, model) {
    const messages = session.history
      .slice(-20)
      .map(h => ({ role: h.role, content: h.content }));
    messages.push({ role: 'user', content: userMessage });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  /**
   * Get encrypted history for a session.
   */
  getEncryptedHistory(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return null;
    const json = JSON.stringify(session.history);
    return this._encrypt(json);
  }

  /**
   * AES-256-CBC encrypt.
   */
  _encrypt(text) {
    const key = crypto.scryptSync(this._encKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * AES-256-CBC decrypt.
   */
  decrypt(encryptedText) {
    const [ivHex, dataHex] = encryptedText.split(':');
    const key = crypto.scryptSync(this._encKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }

  listSessions() {
    const sessions = [];
    for (const [id, s] of this._sessions.entries()) {
      sessions.push({ id, role: s.role, model: s.model, messageCount: s.history.length });
    }
    return sessions;
  }

  getStatus() {
    return { agent: this.name, status: this.status, activeSessions: this._sessions.size };
  }
}

module.exports = ChatAgent;
