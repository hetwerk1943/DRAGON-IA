# Deployment Guide

## Development Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker and docker-compose
- Git

### Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

```bash
cp .env.example .env
docker-compose up --build
```

## Production Deployment

### Environment Variables

Set all variables from `.env.example` with production values:

- `SECRET_KEY` — Strong random string (64+ characters)
- `DATABASE_URL` — Production PostgreSQL connection string
- `REDIS_URL` — Production Redis connection string
- `OPENAI_API_KEY` — Your OpenAI API key
- `DEBUG` — Set to `false`

### Docker Production

```bash
docker-compose -f docker-compose.yml up -d --build
```

### Database Migrations

```bash
cd backend
alembic upgrade head
```

### Health Monitoring

- Backend health: `GET /health`
- Database: PostgreSQL health check in docker-compose
- Redis: Redis health check in docker-compose

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Lint** — Runs ruff on all Python code
2. **Test** — Runs pytest with coverage requirements
3. **Build** — Builds Docker images for backend and frontend

Pipeline runs on every push and pull request to `main`.

## Scaling Considerations

1. **Multiple API instances** behind a load balancer (nginx/traefik)
2. **PostgreSQL** read replicas for read-heavy workloads
3. **Redis Cluster** for distributed caching
4. **Qdrant cluster** for vector search scaling
5. **Celery workers** scaled independently for async tasks
6. **CDN** for frontend static assets
