# Blockmail SaaS

Disposable email detection API service. Block temporary and throwaway emails from your signup flows with a 6-tier verification engine.

## Tech Stack

- **Framework:** Next.js 14.2 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Prisma (Supabase Cloud or self-hosted)
- **Cache:** Redis (Upstash for cloud, local Redis for self-hosted)
- **Auth:** Supabase Auth (dashboard login, signup, password reset)
- **API Gateway:** Zuplo (managed edge, rate limiting, key validation)
- **UI:** Tailwind CSS + shadcn/ui
- **Billing:** Stripe (checkout + customer portal)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Monorepo:** Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- PostgreSQL (or use Docker)

### Quick Start (Cloud)

```bash
git clone https://github.com/your-org/blockmail-saas.git
cd blockmail-saas

npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your Supabase, Upstash, and Stripe keys

# Run database migrations
npx prisma db push

# Start development server (port 3010)
npm run dev
```

### Quick Start (Self-Hosted with Docker)

```bash
git clone https://github.com/your-org/blockmail-saas.git
cd blockmail-saas

# Copy and configure environment
cp .env.example .env
# Edit .env with your secrets

# Start all services (Supabase stack + Go engine + Next.js)
docker compose up -d
```

### Environment Variables

See `apps/web/.env.example` for all required variables.

## Development

```bash
npm run dev          # Start dev server on port 3010
npm run test         # Run unit tests
npm run test:run     # Run tests once
npm run test:coverage # Run with coverage report
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checker
npm run build        # Production build
```

## Project Structure

```
blockmail-saas/
├── apps/
│   └── web/              # Next.js 14.2 app (port 3010)
│       ├── src/
│       │   ├── app/      # App Router routes (19 routes)
│       │   │   ├── api/  # API routes (verify, keys, usage, billing, etc.)
│       │   │   ├── (auth)/     # Login, signup, reset password
│       │   │   ├── (dashboard)/ # Dashboard pages
│       │   │   └── docs/       # API documentation page
│       │   ├── lib/      # Services, utilities, validators
│       │   └── components/ # UI components (shadcn/ui)
│       └── prisma/       # Database schema
├── docs/                 # API documentation
├── tests/                # Unit tests (126 tests)
├── e2e/                  # E2E tests (23 tests)
├── docker-compose.yml    # Self-hosted deployment
└── turbo.json            # Monorepo config
```

## Architecture

```
Browser/App → Zuplo Edge → Next.js API → Go Engine → Response
                                     ↕
                              PostgreSQL (usage, keys, auth)
                              Redis (rate limits, caching)
                              Stripe (billing)
```

- **Zuplo Edge:** Rate limiting, API key validation, DDoS protection
- **Next.js API:** Business logic, auth, billing, usage tracking
- **Go Engine:** 6-tier disposable email detection (DNS, MX, blocklists, ASN, infrastructure, patterns)
- **Redis:** Rate limit counters, API key cache (5-min TTL), Upstash for cloud

## API Documentation

See `docs/API.md` for the complete API reference.

### Quick Start

```bash
# Verify an email
curl -X POST https://api.blockmail.dev/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"email": "test@mailinator.com"}'
```

### Plans

| Plan | Requests/Day | Requests/Minute | Price |
|------|-------------|-----------------|-------|
| Free | 100 | 10 | $0 |
| Pro | 10,000 | 100 | $29/mo |
| Enterprise | 100,000 | 1,000 | Custom |

## Testing

```bash
npm run test:run        # Run all unit tests (126 tests)
npm run test:coverage   # Run with v8 coverage
npx playwright test     # Run E2E tests (23 tests)
```

## License

MIT
