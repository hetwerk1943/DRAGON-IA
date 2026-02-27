'use strict';

require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting: max 30 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' },
});

// Chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages format.' });
  }

  // Validate message structure
  const valid = messages.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      ['user', 'assistant', 'system'].includes(m.role) &&
      typeof m.content === 'string' &&
      m.content.length > 0
  );

  if (!valid) {
    return res.status(400).json({ error: 'Invalid message structure.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      max_tokens: 1024,
    });

    if (!completion.choices || completion.choices.length === 0) {
      return res.status(502).json({ error: 'No response received from the AI.' });
    }

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(502).json({ error: 'Failed to get a response from the AI.' });
  }
});

app.listen(PORT, () => {
  console.log(`UltraChat AI Omega server running on http://localhost:${PORT}`);
});
