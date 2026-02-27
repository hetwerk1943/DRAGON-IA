# 🐉 DRAGON AI

**AI Orchestration Platform** — Enterprise-ready, modular, scalable, and secure.

DRAGON AI is not a chatbot. It is a full AI orchestration platform with multi-model support, long-term memory, tool execution, autonomous agents, API access, team workspaces, and enterprise security.

## ✨ Features

- **Multi-Model AI Orchestrator** — Route between GPT-4, GPT-4 Turbo, GPT-3.5 with automatic fallback
- **Long-Term Memory** — Vector database + Redis for persistent context across conversations
- **Tool Execution** — Web search, sandboxed code execution, file processing, plugin system
- **Enterprise Auth** — JWT tokens, API keys, role-based access (User/Admin/Enterprise)
- **Multi-Tenant Workspaces** — Team collaboration with isolated data
- **Billing & Usage Tracking** — Token metering, subscription tiers, Stripe-ready
- **Content Moderation** — Prompt injection detection, input/output safety
- **Streaming Responses** — Server-Sent Events (SSE) for real-time AI output
- **Audit Logging** — Full request tracking for compliance

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  API Gateway  │────▶│  AI Orchestrator │
│  (Next.js)   │     │  (FastAPI)    │     │   (Core Brain)   │
└─────────────┘     └──────┬───────┘     └────────┬────────┘
                           │                       │
                    ┌──────┴───────┐        ┌─────┴──────┐
                    │              │        │             │
              ┌─────▼─────┐ ┌─────▼────┐  ┌▼──────┐ ┌───▼────┐
              │  Auth Svc  │ │ Billing  │  │Memory │ │ Tools  │
              │  (JWT/API) │ │ Service  │  │Service│ │Service │
              └─────┬──────┘ └─────┬────┘  └───┬───┘ └───┬────┘
                    │              │            │         │
              ┌─────▼──────────────▼────────────▼─────────▼────┐
              │              PostgreSQL + Redis + Qdrant         │
              └─────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Vector DB | Qdrant |
| Auth | JWT, bcrypt, API Keys |
| Tasks | Celery (async processing) |
| Infrastructure | Docker, docker-compose |
| CI/CD | GitHub Actions |

## 🚀 Quick Start

### Prerequisites

- Docker and docker-compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/hetwerk1943/DRAGON-IA.git
cd DRAGON-IA

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up --build
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
DRAGON-IA/
├── backend/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   ├── core/          # Security, middleware, dependencies
│   │   ├── infrastructure/# Redis, Vector DB clients
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic layer
│   │   ├── config.py      # Application configuration
│   │   ├── database.py    # Database connection
│   │   └── main.py        # FastAPI application entry
│   ├── tests/             # Unit tests (83 tests)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/app/           # Next.js pages
│   ├── Dockerfile
│   └── package.json
├── docs/                  # Documentation
├── docker-compose.yml     # Full stack orchestration
├── .env.example           # Environment template
└── .github/workflows/     # CI pipeline
```

## 🧪 Testing

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v --cov=app
```

**83 tests** covering:
- AI model routing and context management (90% coverage)
- Memory system (98% coverage)
- Tool execution and safety (75% coverage)
- Billing calculations (79% coverage)
- Authentication and security (100% coverage)
- Content moderation (100% coverage)

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/api-keys` | Create API key |
| POST | `/api/v1/ai/chat` | Send chat request |
| POST | `/api/v1/ai/chat/stream` | Stream chat (SSE) |
| GET | `/api/v1/ai/models` | List available models |
| POST | `/api/v1/conversations/` | Create conversation |
| GET | `/api/v1/conversations/` | List conversations |
| POST | `/api/v1/memory/store` | Store memory |
| POST | `/api/v1/memory/search` | Search memories |
| GET | `/api/v1/tools/` | List tools |
| POST | `/api/v1/tools/execute` | Execute tool |
| GET | `/api/v1/billing/usage` | Get usage stats |
| GET | `/api/v1/billing/subscription` | Get subscription |
| GET | `/api/v1/billing/invoice` | Get invoice |
| GET | `/api/v1/admin/stats` | Platform stats |

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file.
