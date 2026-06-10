# Blockmail SaaS

Disposable email detection API service. Block temporary and throwaway emails from your signup flows.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Prisma
- **Cache:** Redis (Upstash)
- **Auth:** Clerk (dashboard)
- **API Keys:** Unkey (self-hosted)
- **UI:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest + Playwright
- **Monorepo:** Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/blockmail-saas.git
cd blockmail-saas

# Install dependencies
npm install

# Start services (PostgreSQL, Redis, Unkey)
docker compose up -d

# Set up environment variables
cp apps/web/.env.example apps/web/.env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

See `apps/web/.env.example` for all required variables.

## Development

```bash
# Start all services
npm run dev

# Run tests
npm run test

# Run linter
npm run lint

# Run type checker
npm run typecheck

# Build for production
npm run build
```

## Project Structure

```
blockmail-saas/
├── apps/
│   └── web/              # Next.js 15 app
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configs
├── prisma/               # Database schema
├── docs/                 # Documentation
└── docker-compose.yml    # Local development services
```

## API Documentation

See `docs/API.md` for complete API documentation.

## License

MIT
