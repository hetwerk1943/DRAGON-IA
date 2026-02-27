# DRAGON AI

An AI-powered platform that integrates with the OpenAI API, providing a secure
backend proxy and a modern frontend interface.

## Overview

- **Backend** — Node.js / Express (or Python / FastAPI)
  - API key stored server-side (secure)
  - Proxies requests from the frontend to the OpenAI API
- **Frontend** — Modern web interface
  - Chat interface, history, login, and subscription support

## Architecture

The project follows a strict layered architecture:

```
backend/
  src/
    domain/          # Business entities and rules
    application/     # Use cases and orchestration
    infrastructure/  # External services, database, API clients
    interfaces/      # Controllers, middleware, routes
    shared/          # Cross-cutting utilities

frontend/
  src/
    components/      # Reusable UI components
    features/        # Feature-specific modules
    services/        # API client services
    hooks/           # Custom hooks
    utils/           # Utility functions
    layouts/         # Page layouts
    styles/          # Global stylesheets and themes
```

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies (see backend/frontend READMEs once initialized)
4. Start the development server

## Documentation

- [Audit Report](docs/AUDIT_REPORT.md) — Full codebase audit and roadmap

## License

[Mozilla Public License 2.0](LICENSE)
