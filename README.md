# DRAGON-IA

AI Orchestration Platform built with Python / FastAPI.

## Architecture

```
Client Layer (Web / Mobile / API)
        ↓
API Gateway  (FastAPI)
        ↓
AI Orchestrator  (Core Brain)
        ↓
┌────────────┬────────┬───────┬───────┐
│ ModelRouter │ Memory │ Tools │ Guard │
└────────────┴────────┴───────┴───────┘
        ↓
Infrastructure Layer
(DB, Vector DB, Cache, Queue, Logs)
```

### Layers

| Layer | Module | Purpose |
|---|---|---|
| **API Gateway** | `dragon_ia.gateway` | FastAPI routes (`/api/v1/chat`, `/api/v1/tool`, `/api/v1/health`) |
| **AI Orchestrator** | `dragon_ia.orchestrator` | Coordinates model routing, memory, tools, and guard |
| **Model Router** | `dragon_ia.core.model_router` | Directs requests to the appropriate AI model |
| **Memory** | `dragon_ia.core.memory` | Per-session conversation history |
| **Tools** | `dragon_ia.core.tools` | Registry of callable tool functions |
| **Guard** | `dragon_ia.core.guard` | Input / output validation and safety checks |
| **Infrastructure** | `dragon_ia.infrastructure` | Database, Vector DB, Cache, Message Queue, Logging |

## Quick start

```bash
pip install -r requirements.txt
uvicorn dragon_ia.main:app --reload
```

## Tests

```bash
pip install pytest httpx
python -m pytest tests/ -v
```
