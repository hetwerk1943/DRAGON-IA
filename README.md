# 🐉 DRAGON-IA — The Autonomous Intelligence Platform

> *"We're building an operating system for artificial intelligence."*

Enterprise-grade AI orchestration platform with microservice architecture,
multi-model support, long-term memory, autonomous tool execution, and
premium UX.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│         Chat · Streaming · Role-based Dashboards            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Gateway Service                          │
│        Rate Limiting · JWT Auth · API Keys · Logging        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   AI Orchestrator                           │
│   Model Routing · Context Builder · Tool Loop · Parser      │
└───┬──────────────────┬─────────────────────┬────────────────┘
    │                  │                     │
┌───▼──────┐   ┌──────▼───────┐   ┌────────▼─────────┐
│  Model   │   │   Memory     │   │ Tool Execution   │
│Abstraction│  │   Service    │   │    Service       │
│  Layer   │   │              │   │                  │
│OpenAI    │   │Redis (short) │   │Code Runner       │
│Anthropic │   │Qdrant (long) │   │Web Search        │
│Local LLM │   │Compression   │   │File Processor    │
│Fallback  │   │              │   │External APIs     │
└──────────┘   └──────────────┘   └──────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│               Security & Audit Service                      │
│         Monitoring · Audit Trail · Abuse Detection           │
└─────────────────────────────────────────────────────────────┘
```

## Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Gateway** | 8000 | Rate limiting, JWT auth, API key management, request routing |
| **AI Orchestrator** | 8001 | Model routing, context building, tool execution loop, structured output |
| **Model Abstraction** | 8002 | Unified API for OpenAI, Anthropic, local LLMs with automatic fallback |
| **Memory Service** | 8003 | Short-term (Redis) + long-term (Qdrant vector DB) memory with compression |
| **Tool Execution** | 8004 | Sandboxed code runner, web search, file processing, external APIs |
| **Security & Audit** | 8005 | Monitoring, audit trail, abuse detection |
| **Frontend** | 3000 | Next.js with streaming responses and role-based dashboards |

## Tech Stack

### Backend
- **Python (FastAPI)** — async, high-performance AI backend
- **PostgreSQL** — relational data and audit logs
- **Redis** — caching and short-term memory
- **Qdrant** — vector database for long-term memory
- **Docker + Kubernetes** — containerisation and orchestration

### Frontend
- **Next.js** — React framework with SSR
- **Streaming responses** — SSE / WebSockets
- **Role-based dashboards** — Admin, Team, User views

### Cloud (production)
- AWS / GCP with auto-scaling, load balancer, and CDN

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 20+, Python 3.12+

### Run with Docker Compose

```bash
# Copy environment template
cp .env.example .env

# Start all services
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://localhost:8000 | Gateway API |
| http://localhost:8000/docs | Gateway Swagger UI |

### Local Development

**Backend (any service):**
```bash
cd backend
pip install -r gateway/requirements.txt
uvicorn gateway.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## MVP Features (Startup-Ready)

| Feature | Status |
|---------|--------|
| Chat + streaming | ✅ Scaffolded |
| Long-term memory | ✅ Scaffolded |
| Web search tool | ✅ Scaffolded |
| Code execution tool | ✅ Scaffolded |
| File processing tool | ✅ Scaffolded |
| API access | ✅ Scaffolded |
| Team workspace | 🔲 Planned |
| Subscriptions | 🔲 Planned |

---

## Monetization Model

### SaaS Subscription
| Tier | Price | Features |
|------|-------|----------|
| Free | €0 | Limited messages |
| Pro | €29–49/mo | Full access |
| Team | €99–299/mo | Workspace, shared memory |
| Enterprise | Custom | SLA, on-premise, white-label |

### API Billing
- Pay per token
- White-label AI

### Vertical AI (highest revenue)
- **Dragon AI Legal** — AI for lawyers
- **Dragon AI Dev** — AI for developers
- **Dragon AI Trader** — AI for traders

---

## Security Plan

### Application Layer
- JWT rotation
- API keys per workspace
- Rate limiting
- Input validation
- Prompt injection protection

### AI Layer
- Output moderation
- Jailbreak detection
- Tool execution sandbox
- Model isolation

### Infrastructure Layer
- Encrypted database
- Private VPC
- Secrets manager (Kubernetes Secrets)
- Audit logs
- Monitoring (Prometheus + Grafana)

### Compliance
- GDPR ready
- Data deletion
- User data export
- Enterprise SLA

---

## 12-Month Roadmap

### 🟢 Q1 — Foundation
- [x] Microservice architecture
- [x] Gateway with auth & rate limiting
- [x] AI Orchestrator with model routing
- [x] Multi-provider model abstraction (OpenAI, Anthropic, Local)
- [x] Memory service (Redis + Qdrant)
- [x] Tool execution service
- [x] Security & audit service
- [x] Next.js frontend with chat UI
- [x] Docker Compose & Kubernetes manifests
- [ ] MVP launch — 100 beta users
- [ ] First revenue

### 🟡 Q2 — Scaling
- [ ] Multi-model simultaneous support
- [ ] Agent system
- [ ] Team workspaces
- [ ] Public API
- [ ] Goal: 1,000 paying users

### 🟠 Q3 — Differentiation
- [ ] Autonomous agents
- [ ] Plugin marketplace
- [ ] Vertical specialisation
- [ ] Mobile app
- [ ] Goal: 10,000 users

### 🔴 Q4 — Enterprise
- [ ] White-label offering
- [ ] On-premise version
- [ ] SOC2 preparation
- [ ] Seed / Series A fundraising

---

## Brand Strategy

**Positioning:** *Dragon AI — The Autonomous Intelligence Platform*

- **Design:** Minimalist, clean, premium UX (Apple-level branding)
- **Specialisation:** Best AI for developers OR best AI for business automation
- **Community:** Discord, early adopters, open API, hackathons
- **Narrative:** "We're building an operating system for artificial intelligence."

---

## Project Structure

```
DRAGON-IA/
├── backend/
│   ├── Dockerfile
│   ├── gateway/              # Auth, rate limiting, API keys
│   ├── ai_orchestrator/      # Model routing, context, tools
│   ├── model_abstraction/    # OpenAI / Anthropic / Local LLM
│   ├── memory_service/       # Redis + Qdrant memory
│   ├── tool_execution/       # Code runner, search, files
│   └── security_audit/       # Monitoring, audit, abuse
├── frontend/
│   ├── Dockerfile
│   ├── src/app/              # Next.js app router
│   ├── src/components/       # Chat, Dashboard
│   └── src/lib/              # API utilities
├── k8s/                      # Kubernetes manifests
├── styles/                   # Theme CSS
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

[Mozilla Public License 2.0](LICENSE)
