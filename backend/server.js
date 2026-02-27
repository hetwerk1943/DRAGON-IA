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

// ── Audit logging ──────────────────────────────────────────────────────────
function writeLog(entry) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOGS_DIR, `chat-${date}.log`);
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(file, line);
}

// ── Auto-backup: copy today's log to backups/ daily ───────────────────────
const BACKUPS_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

function runBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const src = path.join(LOGS_DIR, `chat-${date}.log`);
  if (fs.existsSync(src)) {
    const dest = path.join(BACKUPS_DIR, `backup-${date}-${Date.now()}.log`);
    fs.copyFileSync(src, dest);
    console.log(`Backup zapisany: ${dest}`);
  }
}
const BACKUP_INTERVAL_MS = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10) * 60 * 60 * 1000;
setInterval(runBackup, BACKUP_INTERVAL_MS);

// ── In-memory stats ───────────────────────────────────────────────────────
const stats = { totalMessages: 0, totalImages: 0, errors: 0, startedAt: new Date().toISOString() };

// ── PERSONA system prompts ────────────────────────────────────────────────
const PERSONAS = {
  default:      "Jesteś pomocnym asystentem AI o nazwie UltraChat AI.",
  formal:       "Jesteś profesjonalnym, formalnym asystentem biznesowym. Odpowiadaj zwięźle i rzeczowo.",
  humorous:     "Jesteś zabawnym asystentem AI, który lubi żarty i lekki ton, ale zawsze pozostaje pomocny.",
  poetic:       "Jesteś poetyckim asystentem – odpowiadasz w pięknym, metaforycznym języku, często używasz rymów.",
  futuristic:   "Jesteś agientem z przyszłości. Używasz technicznego, futurystycznego języka. Opisujesz technologię z perspektywy roku 2150.",
};

// ── Express app ────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Za dużo zapytań – spróbuj ponownie za minutę." }
});
app.use('/chat', limiter);
app.use('/image', limiter);

// ── /config ────────────────────────────────────────────────────────────────
app.get('/config', (_req, res) => {
  res.json({
    adsenseEnabled: process.env.ADSENSE_ENABLED === 'true',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    personas: Object.keys(PERSONAS),
  });
});

// ── /admin/stats ───────────────────────────────────────────────────────────
app.get('/admin/stats', (_req, res) => {
  // Count log lines from today's file for accurate totals
  const date = new Date().toISOString().slice(0, 10);
  const logFile = path.join(LOGS_DIR, `chat-${date}.log`);
  let chatCount = 0;
  let errorCount = 0;
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const e = JSON.parse(line);
        if (e.type === 'chat') chatCount++;
        if (e.type === 'error') errorCount++;
      } catch { /* skip malformed */ }
    }
  }
  res.json({
    uptimeSecs: Math.floor(process.uptime()),
    startedAt: stats.startedAt,
    todayMessages: chatCount,
    todayErrors: errorCount,
    totalImages: stats.totalImages,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    logFiles: fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.log')),
  });
});

// ── /chat ──────────────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const { message, history = [], persona = 'default' } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Brak wiadomości" });
  }

  // Content moderation
  try {
    const modRes = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ input: message })
    });
    if (modRes.ok) {
      const modData = await modRes.json();
      if (modData.results?.[0]?.flagged) {
        writeLog({ type: 'moderation', message });
        return res.status(400).json({ error: "Wiadomość narusza zasady użytkowania." });
      }
    }
  } catch { /* moderation failure is non-blocking */ }

  const systemPrompt = PERSONAS[persona] || PERSONAS.default;
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20),
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
      stats.errors++;
      writeLog({ type: 'error', status: response.status, message });
      return res.status(response.status).json({ error: "Błąd API OpenAI" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    stats.totalMessages++;
    writeLog({ type: 'chat', userMessage: message, aiReply: reply, model, persona });
    res.json(data);
  } catch (err) {
    stats.errors++;
    console.error(err);
    writeLog({ type: 'error', error: err.message, message });
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ── /image ─────────────────────────────────────────────────────────────────
app.post('/image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: "Brak opisu obrazu" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.trim(),
        n: 1,
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Błąd generowania obrazu" });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || null;
    stats.totalImages++;
    writeLog({ type: 'image', prompt });
    res.json({ url: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera przy generowaniu obrazu" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend uruchomiony: http://localhost:${PORT}`));
