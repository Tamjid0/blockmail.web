# ARCHITECTURE

> **System design for Blockmail SaaS**

---

## Overview

Blockmail SaaS is a multi-tenant API service for disposable email detection. The architecture prioritizes:
1. **Security** — every request authenticated and validated
2. **Performance** — < 100ms API response time
3. **Reliability** — graceful degradation, no single point of failure
4. **Scalability** — horizontal scaling for each component

---

## Component Diagram

```
                    ┌─────────────────────────────┐
                    │         CDN (Vercel)         │
                    │   Static assets, edge cache  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      Next.js 15 (Edge)      │
                    │                              │
                    │  Middleware Layer:            │
                    │  1. Clerk session validation │
                    │  2. Unkey API key verify     │
                    │  3. Rate limit check         │
                    │  4. Input validation (Zod)   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │    Clerk        │  │    Unkey        │  │   Go Engine     │
    │    (Auth)       │  │    (API Keys)   │  │   (Docker)      │
    │                 │  │                 │  │                 │
    │  - Sessions     │  │  - Key CRUD     │  │  - 6-tier       │
    │  - JWT tokens   │  │  - Verification │  │    verification │
    │  - User mgmt    │  │  - Rate limits  │  │  - Harvester    │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │        PostgreSQL            │
                    │        (Prisma)              │
                    │                              │
                    │  - users                     │
                    │  - api_keys                  │
                    │  - usage_logs                │
                    │  - webhooks                  │
                    │  - plans                     │
                    └─────────────────────────────┘
```

---

## Request Flow

### Dashboard Request (User logged in)
```
Browser → Clerk session cookie → Next.js middleware validates JWT
       → Attach user context → Route handler → Prisma query → Response
```

### API Request (Customer's backend)
```
Customer → X-API-Key header → Next.js middleware calls Unkey.verify()
        → Unkey returns valid + metadata (userId, plan, rateLimit)
        → Forward to Go engine → Engine verifies email → Response
```

---

## Authentication Layers

### Layer 1: Dashboard (Clerk)
- **What:** Session-based auth for browser users
- **How:** Clerk `<SignIn />` component → JWT cookie → middleware validates
- **When:** Every dashboard page load

### Layer 2: API (Unkey)
- **What:** API key auth for programmatic access
- **How:** `X-API-Key` header → Unkey API verify → key metadata returned
- **When:** Every `/api/v1/*` request

### Layer 3: Internal (Service-to-Service)
- **What:** Auth between Next.js and Go engine
- **How:** Shared secret in `X-Internal-Key` header
- **When:** Next.js forwards request to Go engine

---

## Data Flow

### User Signs Up
```
1. User visits /sign-up
2. Clerk renders hosted sign-up page
3. User completes sign-up (OAuth or email)
4. Clerk webhook → POST /api/webhooks/clerk
5. Webhook creates user in PostgreSQL
6. User redirected to dashboard
```

### User Creates API Key
```
1. User clicks "Create API Key" in dashboard
2. Frontend calls POST /api/keys
3. API route calls Unkey.keys.create()
4. Unkey returns key (shown ONCE to user)
5. API stores keyHash (SHA-256) in PostgreSQL
6. User copies key (never shown again)
```

### Customer Verifies Email
```
1. Customer sends POST /api/v1/verify
2. Header: X-API-Key: bm_live_xxxxx
3. Middleware calls Unkey.keys.verify()
4. Unkey validates key, returns metadata
5. Middleware attaches userId, plan to context
6. Route handler forwards to Go engine
7. Go engine runs 6-tier verification
8. Response returned to customer
9. Usage logged asynchronously
```

---

## Rate Limiting Strategy

### Per-API-Key (via Unkey)
- Free tier: 100 requests/day
- Pro tier: 1,000 requests/day
- Enterprise: Custom

### Per-IP (via Redis)
- Global fallback: 1000 requests/minute
- Prevents abuse even if key is compromised

### Per-User (via Clerk + Redis)
- Dashboard actions: 100 requests/minute
- Prevents dashboard abuse

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please upgrade your plan.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2026-06-11T00:00:00Z"
    }
  }
}
```

### Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Key doesn't have permission |
| `RATE_LIMITED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INTERNAL_ERROR` | 500 | Server error |
| `ENGINE_UNAVAILABLE` | 503 | Go engine is down |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL                                  │
│                                                              │
│  Next.js App (Edge Functions)                                │
│  - Dashboard pages                                           │
│  - API routes                                                │
│  - Middleware                                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────┐     ┌─────────────────────┐
│    Railway/Fly.io    │     │      Upstash        │
│                     │     │                     │
│  Go Blockmail       │     │  Redis              │
│  (Docker)           │     │  (Serverless)       │
│  + Redis (optional) │     │                     │
└─────────────────────┘     └─────────────────────┘
              │
              ▼
┌─────────────────────┐
│    Neon/Supabase    │
│                     │
│  PostgreSQL         │
│  (Serverless)       │
└─────────────────────┘
```

---

## Scalability Considerations

### Current Design (MVP)
- Single-region deployment
- Serverless PostgreSQL (auto-scales)
- Serverless Redis (auto-scales)
- Go engine on single instance (sufficient for 10k users)

### Future Scale (100k+ users)
- Multi-region deployment
- Go engine behind load balancer
- Read replicas for PostgreSQL
- Redis Cluster for high throughput

---

## Security Architecture

See `SECURITY.md` for complete security measures.

### Summary
- Clerk handles session security
- Unkey handles API key security
- Our middleware handles request validation
- Go engine handles verification security
- All data encrypted at rest and in transit

---

## Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 15 | Best React framework, API routes, edge |
| Auth | Clerk | Best DX, no custom UI needed |
| API Keys | Unkey (self-hosted) | Purpose-built, full control |
| Database | PostgreSQL | Industry standard, reliable ORM support |
| ORM | Prisma | Best TypeScript ORM, type-safe queries |
| Cache | Redis | Industry standard, fast |
| UI | shadcn/ui | Accessible, customizable, dark mode |
| Styling | Tailwind | Utility-first, responsive |
| Validation | Zod | End-to-end type safety |
| Testing | Vitest + Playwright | Fast unit tests + reliable E2E |

---

**This document is the source of truth for system design.**
