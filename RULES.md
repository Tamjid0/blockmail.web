# RULES & EXPECTATIONS — PINNED

> **This document is the source of truth. Every decision must align with these rules.**
> **If in doubt, come back here. Never compromise on these.**

---

## THE NON-NEGOTIABLES

### 1. Production Grade or Nothing
- Every line of code must be production-ready from day 1
- No "we'll fix it later" — there is no later
- No shortcuts, no hacks, no temporary solutions
- If it's not ready for 1M users tomorrow, don't write it

### 2. End-to-End Final Product Only
- Every implementation must be an end-to-end final product — no demos, no prototypes
- Plan before implementing — understand the full scope before writing code
- Ask before making critical decisions — never assume, always confirm
- If you're unsure about architecture, technology, or approach — ask first

### 3. 100% Type Safety
- TypeScript strict mode — ALWAYS
- Shared types between frontend and backend (Zod schemas)
- No `any` types — ever
- No `as` type assertions — unless absolutely necessary with documented reason
- Every API response, every database query, every component prop — typed

### 4. 100% Test Coverage
- Unit tests for every utility, service, and component
- Integration tests for every API route
- E2E tests for every critical user flow
- Tests written BEFORE or ALONGSIDE implementation
- No PR merged without tests

### 5. Security is Not Optional
- CSRF protection on all state-changing routes
- Content Security Policy headers
- Rate limiting (per-user, per-IP, per-API-key)
- Input validation with Zod on EVERY endpoint
- SQL injection prevention (Prisma handles this)
- XSS prevention (React escaping + CSP)
- API keys stored as SHA-256 hashes only
- Environment variables validated at startup
- Audit logging for all sensitive operations
- No secrets in code — ever

### 6. Design Principles
- Clean, modern, professional
- NO gradients
- NO neon colors
- NO flashy animations
- Dark mode + Light mode (both must be perfect)
- Fully responsive (mobile, tablet, desktop)
- Accessible (WCAG 2.1 AA minimum)
- Fast — no loading spinners for instant operations

### 7. Architecture
- Monorepo with Turborepo
- Shared packages (types, config, UI)
- Clear separation of concerns
- Every module has a single responsibility
- Dependencies flow inward (no circular deps)
- **Max 300-350 lines per file** — break into smaller files when exceeded

### 8. Documentation
- Every API endpoint documented
- Every environment variable documented
- Every architectural decision documented
- Code is self-documenting (clear names, no comments needed)

---

## THE STACK (LOCKED IN)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | SSR/SSG, API routes, edge |
| Language | TypeScript (strict) | 100% type safety |
| Database | PostgreSQL + Prisma | Type-safe ORM, migrations |
| Cache | Redis | Rate limiting, caching |
| Auth | Supabase | Cloud + self-hosted, same API |
| API Keys | Zuplo (production) + Self-managed (dev/self-hosted) | Edge validation, 100K free/month |
| UI | shadcn/ui + Radix | Accessible, dark/light |
| Styling | Tailwind CSS | Utility-first, responsive |
| Validation | Zod | End-to-end type safety |
| State | TanStack Query | Server state, caching |
| Testing | Vitest + Playwright | Unit/integration + E2E |
| Monorepo | Turborepo | Shared packages, parallel builds |
| Engine | Go Blockmail (Docker) | Existing, proven, fast |
| Deploy (Cloud) | Vercel + Supabase + Upstash + Railway | Managed, scalable |
| Deploy (Self-hosted) | Docker Compose | Full control, single VPS |

---

## WHAT WE'RE BUILDING

**Blockmail SaaS** — A disposable email detection API service.

### Core Product
- Users sign up → get API keys → integrate into their apps
- Our API validates emails using the Go engine (6-tier funnel)
- Users see usage stats, manage keys, configure webhooks

### Users
- **Companies/developers** who want to block temp emails from their signups
- They manage their own API keys through our dashboard

### NOT Building
- Not building a new email verification engine (Go engine exists)
- Not building custom auth (Supabase handles it)
- Not building custom API key management (Zuplo handles it in production)

---

## DEPLOYMENT MODES

### Cloud Deploy (Recommended for launch)
- Vercel → Next.js
- Supabase Cloud → PostgreSQL + Auth
- Upstash → Redis
- Railway → Go Engine
- Zuplo → API key management, rate limiting, analytics
- Config: `.env.cloud`

### Self-Hosted Deploy (For full control)
- Docker Compose → Everything on one VPS
- Supabase Local → PostgreSQL + Auth
- Redis (Docker) → Cache
- Go Engine (Docker) → Email verification
- Next.js (Docker) → Web app
- Config: `.env.selfhosted`

### Switching Between Modes
- Same codebase — zero code changes
- Just swap env files and deploy method

---

## WHAT SUCCESS LOOKS LIKE

- [ ] A user can sign up in < 30 seconds
- [ ] A user can generate an API key in < 10 seconds
- [ ] A user can integrate in < 5 minutes (copy-paste code)
- [ ] API response time < 100ms (p99)
- [ ] Zero security vulnerabilities
- [ ] All tests passing
- [ ] Dark mode works perfectly
- [ ] Mobile responsive everywhere
- [ ] Production deployment works on first try
- [ ] Can switch between cloud and self-hosted with zero code changes

---

## BREAKING THESE RULES

If any code violates these rules:
1. It gets rejected in code review
2. It gets fixed before merge
3. No exceptions

**This document is sacred. Read it before every session.**
