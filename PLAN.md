# BLOCKMAIL SAAS — COMPLETE PROJECT PLAN

> **Last Updated:** 2026-06-10
> **Status:** Planning Phase

---

## 1. PROJECT OVERVIEW

### What
Blockmail SaaS is a disposable email detection API service. Companies integrate our API to block temporary/throwaway emails from their signup flows.

### How
- Users sign up via Clerk-authenticated dashboard
- Users generate API keys via self-hosted Unkey
- Users integrate our API (Go engine backend)
- Users monitor usage, manage keys, configure webhooks

### Why
- Existing Go engine is production-grade but was built for internal use (pdfx)
- Market need: developers want temp email blocking without building it
- SaaS model: free tier → paid tiers based on volume

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│   Browser (Dashboard)  │  Customer's Backend (API)              │
└─────────────┬───────────────────────────┬───────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 (Vercel)                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Dashboard UI   │  │          API Routes                  │ │
│  │                  │  │                                      │ │
│  │  /sign-in        │  │  /api/v1/verify    (Unkey auth)     │ │
│  │  /sign-up        │  │  /api/v1/check     (Unkey auth)     │ │
│  │  /dashboard      │  │  /api/keys/*       (Clerk auth)     │ │
│  │  /dashboard/keys │  │  /api/usage/*      (Clerk auth)     │ │
│  │  /dashboard/logs │  │  /api/webhooks/*   (Clerk auth)     │ │
│  │  /docs           │  │                                      │ │
│  │  /pricing        │  │                                      │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                 │
│  Middleware: Clerk session → Unkey verification → Rate limiting │
└─────────────┬───────────────────────────┬───────────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────┐          ┌──────────────────────────────────┐
│    PostgreSQL    │          │          Go Blockmail             │
│    (Prisma)      │          │          (Docker)                 │
│                  │          │                                  │
│  users           │          │  6-tier verification engine      │
│  api_keys        │          │  Harvester (background worker)   │
│  usage_logs      │          │  Redis (blocklists, rate limit)  │
│  webhooks        │          │  RDAP, DNS, ASN lookups          │
│  plans           │          │                                  │
└──────────────────┘          └──────────────────────────────────┘
              │                           │
              └─────────┬─────────────────┘
                        ▼
               ┌────────────────┐
               │     Redis      │
               │  (Upstash)     │
               │                │
               │  Rate limits   │
               │  Caching       │
               │  Sessions      │
               └────────────────┘
```

---

## 3. MONOREPO STRUCTURE

```
blockmail-saas/
├── apps/
│   └── web/                          # Next.js 15 app
│       ├── app/
│       │   ├── (marketing)/          # Public pages (no auth)
│       │   │   ├── page.tsx          # Landing
│       │   │   ├── pricing/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (auth)/               # Clerk auth pages
│       │   │   ├── sign-in/[[...sign-in]]/page.tsx
│       │   │   └── sign-up/[[...sign-up]]/page.tsx
│       │   ├── (dashboard)/          # Protected dashboard
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── dashboard/keys/page.tsx
│       │   │   ├── dashboard/usage/page.tsx
│       │   │   ├── dashboard/logs/page.tsx
│       │   │   ├── dashboard/webhooks/page.tsx
│       │   │   ├── dashboard/settings/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (docs)/               # API documentation
│       │   │   ├── docs/page.tsx
│       │   │   ├── docs/quickstart/page.tsx
│       │   │   ├── docs/api-reference/page.tsx
│       │   │   └── layout.tsx
│       │   ├── api/                  # API routes
│       │   │   ├── v1/
│       │   │   │   ├── verify/route.ts
│       │   │   │   └── check/route.ts
│       │   │   ├── keys/
│       │   │   │   ├── route.ts      # CRUD keys
│       │   │   │   └── [keyId]/route.ts
│       │   │   ├── usage/route.ts
│       │   │   ├── webhooks/route.ts
│       │   │   └── health/route.ts
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                   # shadcn components
│       │   ├── dashboard/            # Dashboard-specific
│       │   ├── landing/              # Landing page
│       │   └── docs/                 # Documentation
│       ├── lib/
│       │   ├── unkey.ts              # Unkey client
│       │   ├── prisma.ts             # Prisma client
│       │   ├── redis.ts              # Redis client
│       │   ├── validator.ts          # Zod schemas
│       │   └── constants.ts
│       ├── middleware.ts             # Clerk + Unkey middleware
│       └── types/
│           └── index.ts
├── packages/
│   ├── ui/                           # Shared UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── types/                        # Shared TypeScript types
│   │   ├── api.ts                    # API request/response types
│   │   ├── models.ts                 # Database model types
│   │   └── index.ts
│   ├── config/                       # Shared configs
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   └── blockmail-sdk/                # JS/TS SDK (for customers)
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/                             # Documentation
│   ├── PLAN.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── turbo.json
├── package.json
└── .env.example
```

---

## 4. DEVELOPMENT PHASES

### Phase 1: Foundation (Week 1)
- [ ] Initialize Turborepo monorepo
- [ ] Set up shared configs (TypeScript, ESLint, Prettier)
- [ ] Set up Next.js 15 app with Tailwind + shadcn
- [ ] Set up Clerk authentication
- [ ] Set up Prisma + PostgreSQL schema
- [ ] Set up Redis (Upstash)
- [ ] Set up self-hosted Unkey
- [ ] Docker Compose for local development

### Phase 2: Core Features (Week 2)
- [ ] Landing page (marketing)
- [ ] Sign-in / Sign-up pages (Clerk hosted)
- [ ] Dashboard layout + navigation
- [ ] API key management (Unkey integration)
- [ ] API verification endpoint (Go engine proxy)
- [ ] Basic usage stats display

### Phase 3: Dashboard Features (Week 3)
- [ ] Usage analytics page
- [ ] Verification logs page
- [ ] Webhook management
- [ ] Account settings
- [ ] Billing foundation (Stripe ready)

### Phase 4: Documentation & SDK (Week 4)
- [ ] API documentation (interactive)
- [ ] Quickstart guide
- [ ] JS/TS SDK package
- [ ] Code examples (Python, Go, Node, PHP)

### Phase 5: Security & Testing (Week 5)
- [ ] Security audit (CSRF, CSP, rate limiting)
- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Performance testing

### Phase 6: Production Ready (Week 6)
- [ ] Vercel deployment
- [ ] Environment variable validation
- [ ] Monitoring (Sentry, analytics)
- [ ] Error tracking
- [ ] Load testing
- [ ] Documentation polish

---

## 5. DATABASE SCHEMA (Preview)

See `docs/DATABASE.md` for full schema.

### Core Tables
- `users` — synced from Clerk
- `api_keys` — managed via Unkey, tracked in our DB
- `usage_logs` — per-key usage records
- `webhooks` — user-configured webhook endpoints
- `plans` — pricing tiers (free, pro, enterprise)

---

## 6. API ENDPOINTS (Preview)

See `docs/API.md` for full specification.

### Public (Unkey Auth)
- `POST /api/v1/verify` — Verify single email
- `POST /api/v1/check` — Verify multiple emails

### Protected (Clerk Auth)
- `GET/POST/DELETE /api/keys` — Manage API keys
- `GET /api/usage` — Usage statistics
- `GET/POST/DELETE /api/webhooks` — Webhook management

### Health
- `GET /api/health` — Health check

---

## 7. ENVIRONMENT VARIABLES

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Unkey (Self-hosted)
UNKEY_API_ID=
UNKEY_ROOT_KEY=
UNKEY_URL=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Go Engine
BLOCKMAIL_ENGINE_URL=http://localhost:8080
BLOCKMAIL_ENGINE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 8. SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Signup completion | < 30 seconds |
| API key generation | < 10 seconds |
| Time to first API call | < 5 minutes |
| API latency (p50) | < 50ms |
| API latency (p99) | < 100ms |
| Test coverage | > 90% |
| Security vulnerabilities | 0 |
| Lighthouse score | > 95 |

---

## 9. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Unkey downtime | API keys stop working | Fallback to cached verification |
| Clerk downtime | Dashboard inaccessible | Not critical for API |
| Go engine crash | Verification stops | Health checks + auto-restart |
| Redis outage | Rate limiting fails | Fail-open (allow requests) |
| Database outage | User data at risk | Daily backups, read replicas |

---

**This plan is living. Update it as we build.**
