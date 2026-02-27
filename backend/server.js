import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Błąd: OPENAI_API_KEY nie jest ustawiony. Skonfiguruj go w pliku .env");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

function writeLog(entry) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOGS_DIR, `chat-${date}.log`);
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(file, line);
}

const app = express();
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Za dużo zapytań – spróbuj ponownie za minutę." }
});
app.use('/chat', limiter);

// Expose safe frontend config
app.get('/config', (_req, res) => {
  res.json({
    adsenseEnabled: process.env.ADSENSE_ENABLED === 'true',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  });
});

app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Brak wiadomości" });
  }

  const messages = [
    { role: "system", content: "Jesteś pomocnym asystentem AI o nazwie UltraChat AI." },
    ...history.slice(-20),          // keep last 20 turns for context
    { role: "user", content: message }
  ];

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      writeLog({ type: 'error', status: response.status, message });
      return res.status(response.status).json({ error: "Błąd API OpenAI" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    writeLog({ type: 'chat', userMessage: message, aiReply: reply, model });
    res.json(data);
  } catch (err) {
    console.error(err);
    writeLog({ type: 'error', error: err.message, message });
    res.status(500).json({ error: "Błąd serwera" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend uruchomiony: http://localhost:${PORT}`));
