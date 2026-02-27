// UltraChat AI Omega - Express backend
// Proxies chat requests to OpenAI, keeping the API key server-side.

import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server is not configured with an API key.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: message.trim() }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'OpenAI API error.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    return res.json({ reply });
  } catch (e) {
    return res.status(502).json({ error: 'Failed to reach OpenAI API.' });
  }
});

app.listen(PORT, () => {
  console.log(`UltraChat AI Omega running at http://localhost:${PORT}`);
});
