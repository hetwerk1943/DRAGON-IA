# Architecture Overview

## System Design

DRAGON AI follows a microservices-inspired architecture with clear service boundaries and clean architecture principles.

### Service Boundaries

1. **API Gateway** — FastAPI application serving as the entry point for all requests
2. **Authentication Service** — JWT/API key management, RBAC
3. **AI Orchestrator** — Model routing, context management, response generation
4. **Memory Service** — Short-term (Redis) and long-term (Vector DB) memory
5. **Tool Execution Service** — Sandboxed tool execution with plugin registration
6. **Billing Service** — Token tracking, subscription tiers, invoicing
7. **Admin Service** — Platform statistics, user management, audit logs
8. **Frontend Client** — Next.js application with SSE streaming

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│            API Layer (Routes)            │
├─────────────────────────────────────────┤
│          Service Layer (Logic)           │
├─────────────────────────────────────────┤
│        Domain Layer (Models/Schemas)     │
├─────────────────────────────────────────┤
│     Infrastructure Layer (DB/Cache/AI)   │
└─────────────────────────────────────────┘
```

### Service Communication

```
Frontend (Next.js :3000)
    │
    ▼ HTTP/SSE
API Gateway (FastAPI :8000)
    │
    ├──▶ Auth Service ──▶ PostgreSQL (users, api_keys)
    ├──▶ AI Orchestrator ──▶ OpenAI API (model calls)
    │       │
    │       ├──▶ Memory Service ──▶ Redis (short-term)
    │       │                  ──▶ Qdrant (long-term vectors)
    │       │                  ──▶ PostgreSQL (metadata)
    │       │
    │       └──▶ Tool Service ──▶ Sandboxed execution
    │
    ├──▶ Billing Service ──▶ PostgreSQL (usage, subscriptions)
    │
    └──▶ Admin Service ──▶ PostgreSQL (audit logs, stats)
```

### Database Schema

```
Users ─────────┬──▶ Workspaces
               ├──▶ ApiKeys
               ├──▶ Conversations ──▶ Messages
               ├──▶ MemoryEmbeddings
               ├──▶ UsageLogs
               └──▶ Subscriptions

Tools (standalone)
AuditLogs (standalone)
```

### Security Architecture

- **Authentication**: JWT tokens + API keys with bcrypt password hashing
- **Authorization**: Role-based access control (USER, ADMIN, ENTERPRISE)
- **Rate Limiting**: Per-IP request limiting (configurable)
- **Input Validation**: Pydantic schemas for all requests
- **Prompt Injection**: Pattern-based detection on all AI inputs
- **Content Moderation**: Input and output safety checking
- **Audit Trail**: Request logging for compliance
- **CORS**: Configurable origin allowlist
- **Secure Headers**: Via FastAPI middleware

### Performance Design

- **Streaming**: SSE for real-time AI responses
- **Caching**: Redis for conversation context and short-term memory
- **Context Trimming**: Automatic message trimming to fit model context windows
- **Model Fallback**: Automatic fallback chain (GPT-4 → GPT-4 Turbo → GPT-3.5)
- **Async Processing**: FastAPI async handlers, Celery for background tasks

### Scalability Path

1. **Horizontal**: Stateless API servers behind load balancer
2. **Database**: Read replicas, connection pooling
3. **Cache**: Redis cluster for distributed caching
4. **Vectors**: Qdrant cluster for distributed vector search
5. **Tasks**: Celery workers scale independently
6. **Frontend**: CDN for static assets, edge rendering
