# Blockmail SaaS — Getting Started

## Prerequisites

- Docker Desktop running
- Node.js 18+
- npm

## Start Services

### 1. Start Docker containers (PostgreSQL, Redis, Go engine)

```bash
cd D:\Antigravity\blockmail-saas
docker compose up -d
```

Verify they're running:

```bash
docker ps
```

You should see 3 containers: `blockmail-engine`, `blockmail-postgres`, `blockmail-redis`.

### 2. Apply database schema

```bash
cd apps/web
npx prisma db push
```

### 3. Start the dev server

```bash
cd apps/web
npm run dev
```

The app runs at **http://localhost:3000**.

## Quick Verification

| Check | Command / URL |
|-------|---------------|
| Health | `curl http://localhost:3000/api/health` |
| Try It (disposable) | `curl -X POST http://localhost:3000/api/v1/try -H "Content-Type: application/json" -d '{"email":"test@mailinator.com"}'` |
| Try It (clean) | `curl -X POST http://localhost:3000/api/v1/try -H "Content-Type: application/json" -d '{"email":"user@gmail.com"}'` |
| Sign-in page | Open http://localhost:3000/sign-in |
| Dashboard | Open http://localhost:3000/dashboard (requires sign-in) |

## Service Ports

| Service | Port | Purpose | Required |
|---------|------|---------|----------|
| Next.js | 3000 | Dashboard, API routes | Yes |
| Go engine | 8080 | Email verification engine | Yes |
| PostgreSQL | 5432 | Database | Yes |
| Redis | 6379 | Rate limiting, caching | Yes |

## Rate Limiting

All rate limiting is Redis-backed and fails closed (denies requests on Redis errors).

### Try-It Page (Anonymous)

| Limit | Value |
|-------|-------|
| Per minute | 3 requests |
| Per day | 10 requests |

### Try-It Page (Logged-In)

| Limit | Value |
|-------|-------|
| Per minute | 5 requests |
| Per day | 25 requests |

### API Verify (Per Plan)

| Plan | Per Minute | Per Day |
|------|------------|---------|
| FREE | 10 | 100 |
| PRO | 100 | 10,000 |
| ENTERPRISE | 1,000 | 100,000 |

### Edge Middleware (Defense in Depth)

| Limit | Value |
|-------|-------|
| Per minute | 60 requests per IP |

## Testing

```bash
cd apps/web
npx vitest run
```

**129 tests passing** across 12 test files covering:
- Services (user, apikey, webhook, usage)
- Rate limiting (sliding window, daily limits, IP-based)
- IP extraction utilities
- SSRF protection
- Audit logging
- Validators
- Billing constants
- Webhook delivery

## Stop Services

```bash
docker compose down
```

To also delete data:

```bash
docker compose down -v
```
