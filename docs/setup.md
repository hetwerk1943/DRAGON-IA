# Setup Instructions

## Quick Start

```bash
git clone https://github.com/hetwerk1943/DRAGON-IA.git
cd DRAGON-IA
cp .env.example .env
docker-compose up --build
```

## Manual Setup

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database

Start PostgreSQL (via Docker or locally):
```bash
docker run -d --name dragon-db \
  -e POSTGRES_USER=dragon \
  -e POSTGRES_PASSWORD=dragon \
  -e POSTGRES_DB=dragon_ai \
  -p 5432:5432 postgres:16-alpine
```

### 3. Redis

```bash
docker run -d --name dragon-redis -p 6379:6379 redis:7-alpine
```

### 4. Run Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Verify

- Backend: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Running Tests

```bash
cd backend
python -m pytest tests/ -v --cov=app
```

## Environment Variables

See `.env.example` for all configuration options.
