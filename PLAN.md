# BLOCKMAIL SAAS — COMPLETE PROJECT PLAN

> **Last Updated:** 2026-06-11
> **Status:** Implementation Complete — Deploy Ready

---

## 1. PROJECT OVERVIEW

### What
Blockmail SaaS is a disposable email detection API service. Companies integrate our API to block temporary/throwaway emails from their signup flows.

### How
- Users sign up via Supabase-authenticated dashboard
- Users generate API keys (self-managed)
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
│                    NEXT.JS 14                                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Dashboard UI   │  │          API Routes                  │ │
│  │                  │  │                                      │ │
│  │  /sign-in        │  │  /api/v1/verify    (API key auth)   │ │
│  │  /sign-up        │  │  /api/v1/try       (public)         │ │
│  │  /dashboard      │  │  /api/keys/*       (session auth)   │ │
│  │  /dashboard/keys │  │  /api/usage/*      (session auth)   │ │
│  │  /dashboard/logs │  │  /api/webhooks/*   (session auth)   │ │
│  │  /docs           │  │                                      │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                 │
│  Middleware: Supabase session → CSRF → Rate limiting            │
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
│                  │          │                                  │
└──────────────────┘          └──────────────────────────────────┘
              │                           │
              └─────────┬─────────────────┘
                        ▼
               ┌────────────────┐
               │     Redis      │
               │                │
               │  Rate limits   │
               │  Caching       │
               └────────────────┘
```

---

## 3. MONOREPO STRUCTURE

```
blockmail-saas/
├── apps/
│   └── web/                          # Next.js 14 app
│       ├── app/
│       │   ├── (auth)/               # Auth pages
│       │   │   ├── sign-in/page.tsx  # Custom Supabase sign-in
│       │   │   ├── sign-up/page.tsx  # Custom Supabase sign-up
│       │   │   └── sign-out/page.tsx
│       │   ├── (dashboard)/          # Protected dashboard
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── dashboard/keys/page.tsx
│       │   │   ├── dashboard/usage/page.tsx
│       │   │   ├── dashboard/webhooks/page.tsx
│       │   │   ├── dashboard/settings/page.tsx
│       │   │   └── layout.tsx
│       │   ├── api/
│       │   │   ├── v1/
│       │   │   │   ├── verify/route.ts
│       │   │   │   └── try/route.ts
│       │   │   ├── keys/route.ts
│       │   │   ├── usage/route.ts
│       │   │   ├── webhooks/route.ts
│       │   │   ├── auth/sync/route.ts
│       │   │   └── health/route.ts
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                   # shadcn components
│       │   └── dashboard/            # Dashboard-specific
│       ├── lib/
│       │   ├── supabase/             # Supabase client utilities
│       │   │   ├── client.ts         # Browser client
│       │   │   ├── server.ts         # Server client
│       │   │   └── middleware.ts     # Middleware helper
│       │   ├── auth.ts               # requireAuth() helper
│       │   ├── prisma.ts             # Prisma client
│       │   ├── validator.ts          # Zod schemas
│       │   ├── constants.ts          # App constants
│       │   └── audit.ts              # Audit logging
│       ├── middleware.ts             # Supabase + CSRF + rate limiting
│       ├── Dockerfile                # Multi-stage build
│       ├── .dockerignore
│       ├── .env                      # Local development
│       ├── .env.cloud                # Cloud deploy
│       ├── .env.selfhosted           # Self-hosted deploy
│       └── .env.example              # Template
├── packages/
│   ├── ui/                           # Shared UI components
│   ├── types/                        # Shared TypeScript types
│   └── config/                       # Shared configs
├── prisma/
│   └── schema.prisma                 # Database schema
├── volumes/
│   ├── api/kong.yml                  # Kong API gateway config
│   └── db/init.sql                   # Database initialization
├── docker-compose.yml                # Development + self-hosted
├── docker-compose.prod.yml           # Production overrides
├── railway.json                      # Railway deploy config
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md                 # Deploy guide
├── ROADMAP.md
├── RULES.md
└── PLAN.md
```

---

## 4. DEVELOPMENT PHASES

### Phase 1: Foundation ✅
- [x] Initialize Turborepo monorepo
- [x] Set up shared configs (TypeScript, ESLint, Prettier)
- [x] Set up Next.js 14 app with Tailwind + shadcn
- [x] Set up Supabase authentication
- [x] Set up Prisma + PostgreSQL schema
- [x] Set up Redis
- [x] Docker Compose for local development

### Phase 2: Core Features ✅
- [x] Custom sign-in / sign-up pages
- [x] Dashboard layout + navigation
- [x] API key management (self-managed)
- [x] API verification endpoint (Go engine proxy)
- [x] Basic usage stats display

### Phase 3: Dashboard Features ✅
- [x] Usage analytics page
- [x] API keys page with copy icon
- [x] Webhook management
- [x] Account settings
- [x] Billing foundation (Stripe ready)

### Phase 4: Documentation & SDK ✅
- [x] API documentation (interactive)
- [x] Quickstart guide
- [x] JS/TS SDK package
- [x] Code examples

### Phase 5: Security & Testing ✅
- [x] Security audit (CSRF, CSP, rate limiting)
- [x] Unit tests (Vitest) — 57 passing
- [x] Environment validation (Zod)
- [x] Audit logging

### Phase 6: Deployment ✅
- [x] Docker Compose (self-hosted)
- [x] Dockerfile (Next.js multi-stage)
- [x] Railway config (Go engine)
- [x] Environment configs (.env.cloud, .env.selfhosted)
- [x] Deploy documentation

### Phase 7: Polish (Remaining)
- [ ] Landing page (pricing, testimonials, FAQ)
- [ ] Error pages (404, 500)
- [ ] Dark mode + Light mode
- [ ] Mobile responsive
- [ ] E2E tests (Playwright)
- [ ] Launch preparation

---

## 5. DATABASE SCHEMA

See `prisma/schema.prisma` for full schema.

### Core Tables
- `User` — synced from Supabase Auth
- `ApiKey` — self-managed, SHA-256 hashed
- `UsageLog` — per-key usage records
- `Webhook` — user-configured webhook endpoints

### Enums
- `Plan` — FREE, PRO, ENTERPRISE

---

## 6. API ENDPOINTS

### Public (No Auth)
- `POST /api/v1/try` — Test with demo key
- `GET /api/health` — Health check

### API Key Auth (X-API-Key header)
- `POST /api/v1/verify` — Verify single email

### Session Auth (Supabase session cookie)
- `GET/POST/DELETE /api/keys` — Manage API keys
- `GET /api/usage` — Usage statistics
- `GET/POST/DELETE /api/webhooks` — Webhook management

### Auth Sync
- `POST /api/auth/sync` — Create user in Prisma after signup

---

## 7. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Go Engine
BLOCKMAIL_ENGINE_URL=
BLOCKMAIL_ENGINE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

### Deploy Configs
- `.env.cloud` — Vercel + Supabase Cloud + Upstash + Railway
- `.env.selfhosted` — Docker Compose (everything local)
- `.env.example` — Template with documentation

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
| Deploy flexibility | Cloud + Self-hosted |

---

## 9. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase downtime | Dashboard inaccessible | Not critical for API |
| Go engine crash | Verification stops | Health checks + auto-restart |
| Redis outage | Rate limiting fails | Fail-open (allow requests) |
| Database outage | User data at risk | Daily backups, read replicas |
| Vercel downtime | Dashboard inaccessible | API still works via Go engine |

---

## 10. DEPLOYMENT MODES

### Cloud (Recommended)
- Vercel → Next.js
- Supabase Cloud → PostgreSQL + Auth
- Upstash → Redis
- Railway → Go Engine
- Cost: $5-65/month

### Self-Hosted
- Docker Compose → Everything on one VPS
- Cost: $40-80/month

### Switching
- Same codebase, zero code changes
- Swap `.env.cloud` → `.env.selfhosted`

---

**This plan is living. Update it as we build.**
