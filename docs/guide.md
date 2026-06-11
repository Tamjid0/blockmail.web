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
| Docs | Open http://localhost:3000/docs |

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Next.js | 3000 | Dashboard, API routes |
| Go engine | 8080 | Email verification engine |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache (optional) |

## Stop Services

```bash
docker compose down
```

To also delete data:

```bash
docker compose down -v
```
