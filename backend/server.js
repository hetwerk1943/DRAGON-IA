import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Błąd: OPENAI_API_KEY nie jest ustawiony. Skonfiguruj go w pliku .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Brak wiadomości" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Błąd API OpenAI" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.listen(3000, () => console.log("Backend uruchomiony: http://localhost:3000"));
