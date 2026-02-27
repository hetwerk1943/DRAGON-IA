# 🐉 Dragon AI

> A next-generation modular AI assistant platform with advanced reasoning, memory, tool usage, and scalable architecture.

## Features

- **Multi-Model Engine** — Dynamic model selection with fallback across multiple LLM providers
- **Memory System** — Short-term conversation memory and long-term vector memory
- **Autonomous Agents** — Task decomposition, tool calling, and multi-step reasoning
- **Tool System** — Extensible plugin system with built-in tools
- **Security** — JWT authentication, rate limiting, role-based access control
- **Streaming** — Real-time streaming responses

## Architecture

```
Frontend (Next.js) → Gateway API (Express) → AI Orchestrator
                                                ├── LLM Service
                                                ├── Memory Service
                                                ├── Tool Service
                                                └── Admin Service
```

See [docs/architecture.md](docs/architecture.md) for the full architecture diagram.

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/hetwerk1943/DRAGON-IA.git
cd DRAGON-IA

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your OpenAI API key

# Start all services
docker-compose up -d
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### Local Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Tech Stack

| Layer      | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js, TypeScript, TailwindCSS  |
| Backend   | Node.js, Express, TypeScript      |
| Database  | PostgreSQL                        |
| Cache     | Redis                             |
| Vector DB | Qdrant                            |
| AI        | OpenAI-compatible API             |
| Auth      | JWT, bcrypt                       |
| DevOps    | Docker, GitHub Actions            |

## Documentation

- [Architecture](docs/architecture.md)
- [Setup Guide](docs/setup.md)
- [API Documentation](docs/api.md)

## Project Structure

```
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── middleware/    # Auth, rate limiting
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── orchestrator/ # AI orchestration
│   │   └── utils/        # Utilities
│   └── prisma/           # Database schema
├── frontend/         # Next.js web application
│   └── src/
│       ├── app/          # Pages
│       ├── components/   # UI components
│       └── lib/          # API client
├── docs/             # Documentation
├── styles/           # Theme files
└── docker-compose.yml
```

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).
