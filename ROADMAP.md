# ROADMAP — Blockmail SaaS

> **Honest roadmap based on actual audit. Every task must be functional, not just a file.**

---

## Current Status (Post-Audit)

| Component | Status | Notes |
|-----------|--------|-------|
| Monorepo | ✅ Done | Turbo, shared packages |
| Next.js 14 | ✅ Done | App Router, 19 routes |
| Supabase Auth | ✅ Done | Login/signup/logout |
| Prisma + PostgreSQL | ✅ Done | Schema, migrations |
| Go Engine | ✅ Done | Docker on :8080 |
| Zuplo Integration | ✅ Done | Shared secret, edge keys |
| Verify API | ✅ Done | Real auth, engine forwarding |
| Dashboard Pages | ⚠️ Partial | Overview, keys, usage, webhooks work. Settings is stub. |
| API Routes | ⚠️ Partial | Core works. Health check hardcoded. Auth sync unprotected. |
| Tests | ❌ Fail | 57 tests on utilities only. 0% coverage of actual product. |
| Documentation | ❌ Fail | Wrong tech stack references, nonexistent endpoints documented. |
| Security | ⚠️ Partial | CSP unsafe-inline, in-memory rate limiting, in-memory audit. |

---

## Phase 1: Critical Security Fixes ✅ → 🔧

### Done
- [x] Zuplo shared secret for gateway verification
- [x] API key create/name bug fix

### To Do
- [ ] Fix `/api/auth/sync` — add auth check (currently anyone can create users)
- [ ] Fix CSP — remove `unsafe-inline` and `unsafe-eval` from `next.config.mjs`
- [x] Fix health check — actually ping DB, Redis, and engine instead of hardcoded `"connected"`
- [x] Persist audit log to database (currently in-memory, lost on restart)
- [x] Persist rate limiting to Redis (currently in-memory, doesn't work across instances)
- [x] Add SSRF protection on webhook URLs
- [x] Make `BLOCKMAIL_SECRET` required when Zuplo is configured

---

## Phase 2: Plans, Limits & Billing ✅

### Pricing Tiers
- [x] Define plan limits in constants (FREE: 100/day, PRO: 10,000/day, ENTERPRISE: 100,000/day)
- [x] Enforce plan limits in verify endpoint using PLAN_LIMITS constants
- [x] Stripe price ID field in PLAN_LIMITS (configurable for admin panel)

### Stripe Integration
- [x] Add Stripe SDK dependency
- [x] Create Stripe checkout session API (`/api/billing/checkout`)
- [x] Create Stripe customer portal API (`/api/billing/portal`)
- [x] Create Stripe webhook handler (`/api/webhooks/stripe`)
- [x] Sync plan changes from Stripe to user plan in DB (checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed)
- [x] Add `stripeCustomerId` and `stripeSubscriptionId` to User model

### Dashboard
- [x] Settings — "Upgrade to Pro" button → Stripe checkout
- [x] Settings — "Delete Account" handler (delete user, keys, webhooks, usage, audit)
- [x] Settings — billing portal for PRO users
- [x] Settings — profile editing (name, email) — Phase 4
- [x] Settings — password change — Phase 4
- [ ] Billing page — current plan, usage, upgrade/downgrade — future enhancement

---

## Phase 3: Per-User Usage Tracking ✅

- [x] Fix Zuplo path to resolve real userId from consumer metadata (forward-user-id policy)
- [x] Wire `key_id` filter in `getUsageStats` (schema exists, now wired in query)
- [x] Add usage breakdown by API key in dashboard (already existed in `by_key`)
- [x] Add usage alerts (80% of limit warning banner on dashboard)
- [ ] Daily usage email summary (optional — deferred)

---

## Phase 4: Authentication Complete ✅

- [x] Forgot password flow (Supabase `resetPasswordForEmail`)
- [x] Reset password page (`/reset-password`)
- [x] Email verification callback page (`/auth/confirm`)
- [x] Profile editing in settings (name update via API)
- [x] Password change in settings (Supabase `updateUser`)
- [ ] OAuth providers (Google, GitHub) — deferred (optional)

---

## Phase 5: Dashboard Complete ✅

- [x] Webhook toggle (enable/disable) — PATCH route + toggle switch UI
- [x] Audit log viewer page (`/dashboard/audit`) with severity filter
- [x] API key usage breakdown (completed in Phase 3)
- [x] Sidebar updated with Audit Log link
- [ ] Activity feed on overview page — deferred (audit logs already viewable)
- [ ] Export usage data (CSV) — deferred
- [ ] Notification preferences

---

## Phase 6: Testing (100% Coverage) ✅

### Unit Tests — 106 tests passing
- [x] `tests/services/user.test.ts` — getUserBySupabaseId, getUserById, createUser, updateUser, deleteUser (7 tests)
- [x] `tests/services/apikey.test.ts` — getApiKeys, getApiKeyById, createApiKey, revokeApiKey, deleteApiKey, getApiKeyByPrefix, updateLastUsedAt (9 tests)
- [x] `tests/services/webhook.test.ts` — getWebhooks, getWebhookById, createWebhook, deleteWebhook, toggleWebhook, incrementFailureCount, resetFailureCount, getActiveWebhooksForEvent (8 tests)
- [x] `tests/services/usage.test.ts` — getUsageStats (with key_id filter, by_key breakdown), getRecentUsage (4 tests)
- [x] `tests/audit.test.ts` — logAudit, getAuditLogs, severity levels, null fields, DB failure (6 tests)
- [x] `tests/validator.test.ts` — all schemas (30 tests)
- [x] `tests/rate-limit.test.ts` — checkRateLimit, checkDailyLimit, Redis failure fail-open (8 tests)
- [x] `tests/ssrf.test.ts` — validateWebhookUrl (localhost, private IPs, metadata, production HTTPS) (9 tests)
- [x] `tests/billing.test.ts` — PLAN_LIMITS config (7 tests)
- [x] `tests/constants.test.ts` — plan limits (13 tests)
- [x] `tests/webhook-delivery.test.ts` — delivery flow (5 tests)

### Integration Tests
- [ ] Full verify flow (auth → engine → response)
- [ ] Key lifecycle (create → use → revoke → rejected)
- [ ] Webhook lifecycle (create → trigger → delivery)

### E2E Tests
- [ ] Signup → create key → verify email → see usage
- [ ] Login → settings → upgrade plan

---

## Phase 7: Documentation Fix ✅

- [x] Fix `README.md` — correct Next.js 14.2, Clerk→Supabase Auth, Unkey→Custom+Zuplo, docker services
- [x] Fix `docs/API.md` — correct port 3010, remove nonexistent `/api/v1/check`, fix error codes, fix health response, fix rate limits, fix auth references
- [x] Fix `apps/web/src/app/docs/data.ts` — remove `/api/v1/check`, fix rate limits, fix health response
- [x] Add OpenAPI spec (`docs/openapi.yaml`) for verify + health endpoints
- [x] Add `.env.example` with all required vars documented
- [x] Remove dead code (`packages/types/` removed, `checkEmailsSchema` removed, `lib/supabase/server.ts` + `client.ts` are active)

### Latency Fixes

- [x] Add local Docker Redis support (`REDIS_URL`) — Upstash > Local Redis > In-memory priority
- [x] Redis pipeline batching — 4 rate limit calls → 1 HTTP request (Upstash) or 1 round trip (local Redis)
- [x] `redis.ts` rewritten with 3-tier fallback (Upstash, ioredis, MemoryStore) + `pipeline()` method
- [x] `rate-limit.ts` rewritten with pipeline for `checkComprehensiveRateLimit` (falls back to individual calls)
- [x] Fixed ioredis JSON serialization (`get()` returns parsed objects, not raw strings)
- [x] `next.config.mjs` — webpack externals for ioredis (fixes `node:diagnostics_channel` build error)
- [x] Tests updated to mock `getRedis` + `pipeline`

### Latency Results

| Email | Before (Upstash) | After (Local Redis) | Improvement |
|-------|------------------|---------------------|-------------|
| `cotrigordo@necub.com` | 2,079ms | 9ms | 230x |
| `licikute@usm.ovh` | 739ms | 7ms | 105x |
| `03px8@web-library.net` | 1,567ms | 120ms | 13x |

Upstash with pipeline: ~500ms (2 round trips from Bangladesh). Local Redis: ~9ms.

---

## Phase 8: Landing Page & Error Pages

### Landing Page
- [ ] Pricing section with 3 tiers
- [ ] Testimonials section
- [ ] FAQ section
- [ ] Privacy page (`/privacy`)
- [ ] Terms page (`/terms`)

### Error Pages
- [ ] 404 page
- [ ] 500 page
- [ ] Rate limit exceeded page

---

## Phase 9: Polish & Launch

- [ ] Dark/light mode toggle polish
- [ ] Responsive design audit (mobile)
- [ ] WCAG 2.1 AA accessibility audit
- [ ] Performance audit (Lighthouse)
- [ ] Email templates (welcome, key created, limit warning)
- [ ] Launch prep (Product Hunt, HN, Twitter)

---

## Phase 10: Deploy

- [ ] Deploy Go engine to Railway
- [ ] Deploy Next.js to Vercel
- [ ] Configure Zuplo cloud (push config to Zuplo Portal)
- [ ] Set up Stripe products/prices
- [ ] Set up Supabase production
- [ ] Smoke test production
- [ ] Monitor for 48 hours

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Test coverage | > 80% |
| API response time | < 100ms (p99) |
| Security vulnerabilities | 0 |
| Documentation accuracy | 100% |
| Deploy flexibility | Cloud + Self-hosted |

---

**This roadmap is honest. Updated from actual codebase audit.**
