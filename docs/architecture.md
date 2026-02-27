# Dragon AI - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│              Port 3000 - Chat UI, Settings               │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────┐
│                  Gateway API (Express)                    │
│                      Port 4000                           │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   Auth   │   Chat   │  Tools   │  Admin   │   Health    │
│  Service │  Routes  │  Routes  │  Routes  │   Check     │
└──────────┴────┬─────┴────┬─────┴──────────┴─────────────┘
                │          │
┌───────────────▼──────────▼──────────────────────────────┐
│              AI Orchestrator                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   LLM    │ │  Memory  │ │   Tool   │ │   Admin    │ │
│  │ Service  │ │ Service  │ │ Service  │ │  Service   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────────┘ │
└───────┼────────────┼────────────┼───────────────────────┘
        │            │            │
   ┌────▼────┐ ┌─────▼────┐ ┌────▼────┐
   │ OpenAI  │ │ Qdrant   │ │  Tool   │
   │ API     │ │ Vector   │ │ Plugins │
   │         │ │ DB       │ │         │
   └─────────┘ └──────────┘ └─────────┘

   ┌──────────┐ ┌──────────┐
   │PostgreSQL│ │  Redis   │
   │ Database │ │  Cache   │
   └──────────┘ └──────────┘
```

## Services

### Gateway API
- Express.js HTTP server
- JWT authentication middleware
- Rate limiting
- Request routing

### AI Orchestrator
Central coordination layer that:
- Selects the best model for each request
- Injects memory context
- Manages tool execution
- Returns structured responses

### LLM Service
- OpenAI-compatible API layer
- Multi-model support (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo)
- Automatic fallback on failure
- Streaming response support

### Memory Service
- Short-term conversation memory
- Long-term vector memory (Qdrant)
- Context retrieval for relevant memories
- User-specific memory isolation

### Tool Service
- Built-in tools (time, calculator, JSON formatter)
- Plugin registration system
- Safe execution with error handling
- Execution time tracking

### Auth Service
- JWT token generation and validation
- Password hashing with bcrypt
- Role-based access control (user/admin)

### Admin Service
- Audit logging
- System statistics
- User management

## Database Schema

| Table              | Purpose                          |
|-------------------|----------------------------------|
| users             | User accounts and roles          |
| agents            | AI agent configurations          |
| conversations     | Chat conversation metadata       |
| messages          | Individual chat messages          |
| memory_embeddings | Vector embeddings for memory     |
| tools             | Registered tool definitions      |
| api_keys          | API key management               |
| audit_logs        | System audit trail               |

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
| Container | Docker, docker-compose            |
| CI/CD     | GitHub Actions                    |
