# ROADMAP

> **Development timeline for Blockmail SaaS**

---

## Phase 1: Foundation (Week 1)

### Goals
- Monorepo structure established
- Development environment working
- Authentication flow working

### Tasks
- [ ] Initialize Turborepo monorepo
- [ ] Configure shared TypeScript, ESLint, Prettier
- [ ] Create Next.js 15 app with App Router
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up Clerk authentication
- [ ] Create sign-in/sign-up pages
- [ ] Set up Prisma with PostgreSQL
- [ ] Create initial database schema
- [ ] Set up Redis (Upstash)
- [ ] Set up self-hosted Unkey
- [ ] Create Docker Compose for local dev
- [ ] Configure environment variables
- [ ] Create .env.example

### Deliverables
- Working Next.js app with Clerk auth
- Database schema applied
- Unkey integrated
- Docker Compose running

---

## Phase 2: Core Features (Week 2)

### Goals
- Landing page live
- API key management working
- Email verification API working

### Tasks
- [ ] Design and build landing page
- [ ] Create pricing page
- [ ] Build dashboard layout
- [ ] Create sidebar navigation
- [ ] Implement API key list page
- [ ] Implement API key creation flow
- [ ] Implement API key revocation
- [ ] Create API verification endpoint
- [ ] Create bulk check endpoint
- [ ] Integrate Go engine proxy
- [ ] Add input validation (Zod)
- [ ] Add error handling

### Deliverables
- Beautiful landing page
- Working API key management
- Working email verification API

---

## Phase 3: Dashboard Features (Week 3)

### Goals
- Usage analytics visible
- Webhook management working
- Account settings complete

### Tasks
- [ ] Build usage analytics page
- [ ] Create usage charts (Recharts)
- [ ] Build verification logs page
- [ ] Implement log filtering
- [ ] Create webhook management page
- [ ] Implement webhook CRUD
- [ ] Add webhook signature verification
- [ ] Build account settings page
- [ ] Add plan display/upgrade UI
- [ ] Implement billing foundation (Stripe ready)

### Deliverables
- Complete dashboard with all features
- Working webhook system
- Billing foundation ready

---

## Phase 4: Documentation & SDK (Week 4)

### Goals
- API documentation complete
- JS/TS SDK published
- Quickstart guide live

### Tasks
- [ ] Create API documentation page
- [ ] Build interactive API explorer
- [ ] Write quickstart guide
- [ ] Create code examples (Python, Go, Node, PHP)
- [ ] Build JS/TS SDK package
- [ ] Publish SDK to npm
- [ ] Create SDK documentation
- [ ] Add SDK usage examples

### Deliverables
- Professional API documentation
- Published JS/TS SDK
- Developer-friendly quickstart

---

## Phase 5: Security & Testing (Week 5)

### Goals
- Security audit passed
- Test coverage > 90%
- All tests passing

### Tasks
- [ ] Security audit (OWASP checklist)
- [ ] Add CSRF protection
- [ ] Configure CSP headers
- [ ] Add rate limiting
- [ ] Write unit tests (Vitest)
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Add test coverage reporting
- [ ] Performance testing
- [ ] Load testing
- [ ] Fix all vulnerabilities

### Deliverables
- Security audit report
- 90%+ test coverage
- Performance benchmarks

---

## Phase 6: Production Ready (Week 6)

### Goals
- Deployed to production
- Monitoring active
- Documentation polished

### Tasks
- [ ] Deploy Next.js to Vercel
- [ ] Deploy Go engine to Railway/Fly.io
- [ ] Set up production database (Neon)
- [ ] Set up production Redis (Upstash)
- [ ] Configure DNS and SSL
- [ ] Set up Sentry error tracking
- [ ] Set up analytics (PostHog)
- [ ] Create deployment scripts
- [ ] Write runbook
- [ ] Polish documentation
- [ ] Launch preparation

### Deliverables
- Production deployment
- Monitoring and alerting
- Complete documentation

---

## Post-Launch (Month 2+)

### Future Features
- [ ] Stripe billing integration
- [ ] Team/organization support
- [ ] Custom blocklists per user
- [ ] Advanced analytics
- [ ] API versioning
- [ ] GraphQL API
- [ ] Mobile app
- [ ] Enterprise features

### Marketing
- [ ] Product Hunt launch
- [ ] Hacker News post
- [ ] Dev.to articles
- [ ] Twitter/X presence
- [ ] GitHub open source (SDK)

---

## Success Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| MVP Live | End of Week 2 | ⬜ |
| Beta Launch | End of Week 4 | ⬜ |
| Production Launch | End of Week 6 | ⬜ |
| 100 Users | Month 2 | ⬜ |
| 1,000 Users | Month 4 | ⬜ |
| First Paying Customer | Month 3 | ⬜ |
| $1k MRR | Month 6 | ⬜ |
| $10k MRR | Month 12 | ⬜ |

---

**This roadmap is living. Update it as we build.**
