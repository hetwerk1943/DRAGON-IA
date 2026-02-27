# DRAGON AI

Production-grade AI platform with a Node.js backend and a modern frontend.

The backend keeps the OpenAI API key server-side (secure). The frontend sends
requests to the backend, which forwards them to the OpenAI API. Planned
features include chat history, authentication, and subscriptions.

## Architecture

The project follows a **clean / layered architecture**:

```
backend/
  src/
    domain/          # Core entities & business rules
    application/     # Use-cases & orchestration
    infrastructure/  # Database, API clients, I/O
    interfaces/      # HTTP controllers & middleware
    shared/          # Cross-cutting utilities

frontend/
  src/
    components/      # Reusable UI components
    features/        # Feature-specific modules
    services/        # API client services
    hooks/           # Custom React hooks
    utils/           # Shared helpers
    layouts/         # Page layouts
    styles/          # Global CSS & themes
```

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Backend

```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## License

[Mozilla Public License 2.0](LICENSE)
