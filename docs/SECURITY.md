# SECURITY

> **Security measures for Blockmail SaaS**

---

## Security Principles

1. **Defense in depth** — Multiple layers of security
2. **Least privilege** — Minimum required permissions
3. **Zero trust** — Verify every request
4. **Secure by default** — Safe defaults, opt-in complexity
5. **No secrets in code** — Environment variables only

---

## Authentication Security

### Dashboard (Clerk)

| Measure | Implementation |
|---------|----------------|
| Session management | Clerk handles entirely |
| Password hashing | bcrypt (Clerk managed) |
| MFA | TOTP, SMS, backup codes |
| OAuth | Google, GitHub, etc. |
| Session expiration | Configurable in Clerk |
| CSRF protection | Clerk middleware |

### API Keys (Unkey)

| Measure | Implementation |
|---------|----------------|
| Key format | `bm_live_` prefix + 32 bytes random |
| Storage | SHA-256 hash only (never raw) |
| Verification | ~50ms at edge |
| Revocation | Instant global propagation |
| Expiration | Configurable per key |
| Rotation | Dashboard + API |

---

## Input Validation

### Zod Schemas

Every API endpoint validates input with Zod:

```typescript
import { z } from 'zod';

const VerifyRequestSchema = z.object({
  email: z.string().email().max(254),
  context: z.object({
    ip_address: z.string().ip().optional(),
    user_agent: z.string().max(500).optional(),
    country_code: z.string().length(2).optional(),
  }).optional(),
});
```

### Validation Rules

| Field | Rules |
|-------|-------|
| Email | Valid format, max 254 chars |
| IP address | Valid IPv4/IPv6 |
| User agent | Max 500 chars |
| Country code | ISO 3166-1 alpha-2 |
| API key name | 1-100 chars, alphanumeric + spaces |
| Webhook URL | Valid HTTPS URL |

---

## Rate Limiting

### Three Layers

1. **Unkey** — Per-API-key rate limiting (primary)
2. **Redis** — Per-IP global rate limiting (fallback)
3. **Clerk** — Per-user dashboard rate limiting

### Configuration

| Layer | Limit | Window |
|-------|-------|--------|
| API (Free) | 100 requests | 24 hours |
| API (Pro) | 1,000 requests | 24 hours |
| IP (Global) | 1,000 requests | 60 seconds |
| Dashboard | 100 requests | 60 seconds |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1718035200
Retry-After: 30
```

---

## CORS Configuration

```typescript
// middleware.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Access-Control-Max-Age': '86400',
};
```

### CORS Policy

| Endpoint | Origin | Methods |
|----------|--------|---------|
| `/api/v1/*` | `*` (public API) | POST, OPTIONS |
| `/api/keys/*` | Same-origin only | GET, POST, DELETE |
| `/api/usage/*` | Same-origin only | GET |
| `/api/webhooks/*` | Same-origin only | GET, POST, DELETE |

---

## Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://clerk.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://clerk.com data:;
  font-src 'self';
  connect-src 'self' https://clerk.com https://api.unkey.dev;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

---

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];
```

---

## Data Protection

### Encryption at Rest
- PostgreSQL: AES-256 (managed by provider)
- Redis: AES-256 (Upstash managed)
- API keys: SHA-256 hashes only

### Encryption in Transit
- TLS 1.3 for all connections
- HSTS enabled
- Certificate pinning for Go engine

### PII Handling

| Data | Stored | Encrypted | Retention |
|------|--------|-----------|-----------|
| Email (raw) | No* | N/A | Never |
| Email hash | Yes | SHA-256 | 90 days |
| IP address | Yes | Plain | 90 days |
| User agent | Yes | Plain | 90 days |
| API key hash | Yes | SHA-256 | Forever |
| Webhook secret | Yes | Plain | Forever |

*Raw emails are passed to Go engine but not stored in our database.

---

## Audit Logging

All sensitive operations are logged:

| Action | Logged |
|--------|--------|
| User sign-up | Yes |
| User sign-in | Yes |
| API key created | Yes |
| API key revoked | Yes |
| API key used | Yes |
| Webhook created | Yes |
| Webhook triggered | Yes |
| Settings changed | Yes |

### Audit Log Format

```json
{
  "timestamp": "2026-06-10T12:00:00Z",
  "action": "api_key.created",
  "user_id": "user_abc123",
  "metadata": {
    "key_id": "key_xyz789",
    "key_name": "Production"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

## Webhook Security

### Signature Verification

Every webhook includes a signature header:

```
X-Blockmail-Signature: sha256=xxxxxxxxxxxx
X-Blockmail-Timestamp: 1718035200
```

### Verification Code

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Webhook Security Rules

| Rule | Implementation |
|------|----------------|
| HTTPS only | Reject HTTP URLs |
| Signature verification | HMAC-SHA256 |
| Timestamp validation | Reject if > 5 minutes old |
| Retry policy | 3 attempts, exponential backoff |
| Failure threshold | Disable after 10 consecutive failures |

---

## Environment Variables

### Required Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook verification |
| `UNKEY_API_ID` | Unkey API identifier |
| `UNKEY_ROOT_KEY` | Unkey root key |

### Security Rules

1. Never commit `.env` files
2. Never log environment variables
3. Use different keys for dev/staging/production
4. Rotate keys every 90 days
5. Use secrets manager in production

---

## Dependency Security

### Measures

| Measure | Frequency |
|---------|-----------|
| `npm audit` | Every CI run |
| Dependabot alerts | Daily |
| Dependency updates | Weekly |
| License review | Monthly |
| Security training | Quarterly |

### Allowed Licenses

- MIT
- Apache 2.0
- BSD 2-Clause
- BSD 3-Clause
- ISC

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Data breach, service down | 1 hour |
| High | Security vulnerability | 4 hours |
| Medium | Suspicious activity | 24 hours |
| Low | Minor issue | 72 hours |

### Response Process

1. **Detect** — Monitoring alerts
2. **Triage** — Assess severity
3. **Contain** — Isolate affected systems
4. **Eradicate** — Remove threat
5. **Recover** — Restore service
6. **Review** — Post-mortem analysis

---

## Compliance

### Current
- GDPR ready (data minimization, right to deletion)
- SOC 2 Type I (planned)

### Future
- SOC 2 Type II
- ISO 27001
- HIPAA (if needed)

---

## Security Checklist

- [ ] All inputs validated with Zod
- [ ] All API keys hashed (SHA-256)
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] CSP headers set
- [ ] Security headers set
- [ ] TLS enforced
- [ ] Audit logging enabled
- [ ] Webhook signatures verified
- [ ] Environment variables secured
- [ ] Dependencies audited
- [ ] No secrets in code

---

**This document is the source of truth for security measures.**
