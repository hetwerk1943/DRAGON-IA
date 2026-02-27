'use strict';

const express = require('express');
const router = express.Router();

module.exports = function createChatRouter(orchestrator) {
  const chatAgent = orchestrator.agents.chat;

  /**
   * POST /chat/message – send a message.
   * Body: { sessionId, message, role, model }
   */
  router.post('/message', async (req, res) => {
    const { sessionId, message, role = 'user', model } = req.body || {};

    if (!sessionId || !message) {
      return res.status(400).json({ ok: false, error: 'sessionId and message are required.' });
    }

    try {
      const result = await chatAgent.chat(sessionId, message, { role, model });
      return res.json({ ok: true, ...result });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * GET /chat/sessions – list active sessions.
   */
  router.get('/sessions', (_req, res) => {
    res.json({ ok: true, sessions: chatAgent.listSessions() });
  });

  /**
   * GET /chat/history/:sessionId – get encrypted history.
   */
  router.get('/history/:sessionId', (req, res) => {
    const encrypted = chatAgent.getEncryptedHistory(req.params.sessionId);
    if (!encrypted) {
      return res.status(404).json({ ok: false, error: 'Session not found.' });
    }
    return res.json({ ok: true, encrypted });
  });

  return router;
};
