# 🐉 DRAGON-IA

A full-stack AI chat application with a multi-agent system, PWA support, and a responsive dark/light UI.

## Features

- **AI Chat** (`/`) – ChatGPT-style interface with session management, typing indicator, and conversation history
- **Multi-Agent Dashboard** (`/agent.html`) – Run repo, test, and security agents with real-time WebSocket updates
- **Joke Generator** (`/web/joke-generator/`) – Fun module powered by JokeAPI with DRAGON-IA fallback
- **PWA** – Installable, offline-capable via Service Worker
- **AdSense placeholders** – 3 safe ad slots per page with ON/OFF toggle (persisted in localStorage)
- **OpenAI integration** – Falls back to mock responses if no API key is configured

## Project Structure

```
DRAGON-IA/
├── server.js              # Express + WebSocket server
├── agents/
│   ├── index.js           # Agent manager
│   ├── repo-agent.js      # Repository analysis
│   ├── test-agent.js      # JSON/JS syntax checks
│   └── sec-agent.js       # HTML security audit
├── public/
│   ├── index.html         # Chat UI
│   ├── agent.html         # Agent dashboard
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Offline caching
│   └── web/
│       └── joke-generator/
│           └── index.html
├── data/                  # Session persistence (git-ignored)
├── logs/                  # Request logs (git-ignored)
├── .env.example
└── package.json
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional – works without OpenAI key in mock mode)
cp .env.example .env
# Edit .env and set OPENAI_API_KEY

# 3. Start the server
npm start
# → http://localhost:3000
```

## Environment Variables

| Variable         | Default       | Description                        |
|------------------|---------------|------------------------------------|
| `OPENAI_API_KEY` | *(none)*      | OpenAI API key (mock mode if unset)|
| `PORT`           | `3000`        | HTTP server port                   |
| `MODEL`          | `gpt-4o-mini` | OpenAI model to use                |

## API Endpoints

| Method | Path                       | Description                       |
|--------|----------------------------|-----------------------------------|
| POST   | `/chat`                    | Send a chat message               |
| GET    | `/chat/history/:sessionId` | Get conversation history          |
| DELETE | `/chat/history/:sessionId` | Clear conversation history        |
| POST   | `/agents/run`              | Trigger agent runs                |
| GET    | `/agents/status`           | Get last agent run results        |

WebSocket is available on the same port for real-time agent updates.

## License

MIT
