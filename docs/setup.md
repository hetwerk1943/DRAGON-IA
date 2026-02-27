# Dragon AI - Setup Guide

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- OpenAI API key (or compatible endpoint)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/hetwerk1943/DRAGON-IA.git
cd DRAGON-IA
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/health

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The backend runs on http://localhost:4000.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs on http://localhost:3000.

## Environment Variables

### Backend

| Variable        | Description                      | Default                              |
|----------------|----------------------------------|--------------------------------------|
| PORT           | Server port                      | 4000                                 |
| NODE_ENV       | Environment                      | development                          |
| DATABASE_URL   | PostgreSQL connection string     | postgresql://dragon:dragon@localhost:5432/dragonai |
| REDIS_URL      | Redis connection string          | redis://localhost:6379               |
| JWT_SECRET     | Secret for JWT tokens            | (required in production)             |
| OPENAI_API_KEY | OpenAI API key                   | (required)                           |
| OPENAI_BASE_URL| OpenAI API base URL              | https://api.openai.com/v1           |
| DEFAULT_MODEL  | Default LLM model               | gpt-4                                |
| VECTOR_DB_URL  | Qdrant vector database URL       | http://localhost:6333                |

### Frontend

| Variable              | Description          | Default                    |
|----------------------|----------------------|----------------------------|
| NEXT_PUBLIC_API_URL  | Backend API URL      | http://localhost:4000/api  |
