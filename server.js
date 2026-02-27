/**
 * server.js – UltraChat AI Omega backend
 *
 * Serves static files and proxies chat requests to the OpenAI API.
 * Requires a .env file with OPENAI_API_KEY set.
 *
 * Usage:
 *   npm start
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/**
 * POST /api/chat
 * Body: { message: string, history: Array<{role, content}> }
 * Returns: { reply: string }
 */
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message field.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured. Set it in your .env file.'
    });
  }

  const messages = [
    { role: 'system', content: 'Jesteś pomocnym asystentem AI. Odpowiadaj po polsku.' },
    ...history.slice(-20),
    { role: 'user', content: message }
  ];

  try {
    const { default: fetch } = await import('node-fetch');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => ({}));
      return res.status(openaiRes.status).json({
        error: errData.error?.message || `OpenAI error ${openaiRes.status}`
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Brak odpowiedzi.';
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`UltraChat AI Omega server running at http://localhost:${PORT}`);
});
