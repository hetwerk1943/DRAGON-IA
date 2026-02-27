# DRAGON AI

Production AI platform — chat interface powered by OpenAI.

Backend + Frontend architecture with server-side API key management.
The frontend sends requests to the backend, which proxies them to the OpenAI
API. Designed to support chat history, authentication, and subscriptions.

## Architecture

```
DRAGON-IA/
├── backend/            # Node.js / TypeScript API server
│   └── src/
│       ├── domain/          # Entities, value objects, domain logic
│       ├── application/     # Use cases, DTOs, application services
│       ├── infrastructure/  # Database, external APIs, integrations
│       ├── interfaces/      # Controllers, routes, middleware
│       └── shared/          # Cross-cutting: logging, errors, config
├── frontend/           # React / TypeScript UI
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── features/        # Feature-specific modules
│       ├── services/        # API client layer
│       ├── hooks/           # Custom React hooks
│       ├── utils/           # Shared utilities
│       ├── layouts/         # Page layout components
│       └── styles/          # Global styles and themes
├── docs/               # Project documentation
├── .env.example        # Environment variable template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/hetwerk1943/DRAGON-IA.git
cd DRAGON-IA

# 2. Create environment file
cp .env.example .env
# Edit .env and add your OpenAI API key

# 3. Install backend dependencies
cd backend && npm install

# 4. Install frontend dependencies
cd ../frontend && npm install
```

### Development

```bash
# Start backend (from backend/)
npm run dev

# Start frontend (from frontend/)
npm run dev
```

## Documentation

- [Audit Report](docs/AUDIT_REPORT.md) — Full codebase audit and findings

## License

[Mozilla Public License 2.0](LICENSE)
