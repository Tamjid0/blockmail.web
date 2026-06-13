# API Reference

> **Blockmail SaaS API — Complete Specification**

---

## Base URL

```
Production:  https://api.blockmail.dev
Local:       http://localhost:3010
```

---

## Authentication

### Dashboard API (Supabase Auth)

All `/api/keys/*`, `/api/usage/*`, `/api/webhooks/*`, `/api/billing/*` routes require a valid Supabase session cookie. These are browser-only routes used by the dashboard.

### Public API (API Key)

All `/api/v1/*` routes require an API key in the `X-API-Key` header.

```
X-API-Key: your_api_key_here
```

### Key Format

API keys come in two formats depending on the authentication path:

**Self-managed keys** (created in dashboard):
```
Prefix:  bm_live_ (production) or bm_test_ (sandbox)
Length:  ~40 chars total
Example: bm_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Zuplo edge keys** (managed by Zuplo gateway):
```
Prefix:  zpka_
Managed by Zuplo API gateway
```

Both key types work with the `/api/v1/verify` endpoint.

---

## Rate Limits

Rate limits are enforced per plan. When using Zuplo, edge rate limits are handled by the gateway. When using self-managed keys, rate limits are enforced by the API.

| Plan | Requests/Day | Requests/Minute |
|------|-------------|-----------------|
| Free | 100 | 10 |
| Pro | 10,000 | 100 |
| Enterprise | 100,000 | 1,000 |

### Headers

Every rate-limited response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
Retry-After: 30
```

---

## Endpoints

### 1. Verify Single Email

**`POST /api/v1/verify`**

Verify if a single email address is disposable. Runs through the 6-tier detection engine.

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "context": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "country_code": "US"
  }
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email to verify (max 254 chars) |
| `context.ip_address` | string | No | Client IP for behavioral analysis |
| `context.user_agent` | string | No | Client user agent (max 500 chars) |
| `context.country_code` | string | No | ISO 3166-1 alpha-2 country code |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "is_disposable": true,
    "risk_score": 95,
    "analysis": {
      "tier_triggered": 2,
      "reason": "domain_blocklist_hit",
      "domain": "mailinator.com"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "latency_ms": 12
  }
}
```

**Analysis Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `tier_triggered` | number | Which tier blocked the email (1-6, 0 = allowed) |
| `reason` | string | Why it was blocked (see reasons below) |
| `domain` | string | Extracted domain |

**Verification Reasons:**
| Reason | Description |
|--------|-------------|
| `allowed` | Passed all checks |
| `syntax_invalid` | Email format is malformed |
| `domain_blocklist_hit` | Domain is on a disposable email blocklist |
| `mx_blocklist_hit` | MX server is on a blocklist |
| `domain_too_new` | Domain registered less than 30 days ago |
| `infra_fingerprint_hit` | Infrastructure fingerprint matches disposable patterns |
| `behavioral_context_hit` | Suspicious behavioral patterns detected |
| `lookup_timeout_failsafe` | DNS/network lookup timed out (fail-safe) |

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid email format |
| 401 | `MISSING_API_KEY` | No API key provided |
| 401 | `INVALID_API_KEY` | API key is invalid or revoked |
| 429 | `RATE_LIMIT_EXCEEDED` | Per-minute rate limit exceeded |
| 429 | `DAILY_LIMIT_EXCEEDED` | Daily rate limit exceeded |
| 503 | `ENGINE_UNAVAILABLE` | Verification engine is not available |

**Example (cURL):**
```bash
curl -X POST https://api.blockmail.dev/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"email": "test@mailinator.com"}'
```

---

### 2. API Key Management

All key management endpoints require Supabase Auth (browser session).

#### List Keys

**`GET /api/keys`**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "key_abc123",
      "name": "Production",
      "keyPrefix": "bm_live_a1b2",
      "permissions": ["verify"],
      "rateLimit": 100,
      "dailyLimit": 100,
      "isActive": true,
      "lastUsedAt": "2026-06-10T12:00:00Z",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

#### Create Key

**`POST /api/keys`**

**Request Body:**
```json
{
  "name": "Production",
  "permissions": ["verify"],
  "rate_limit": 100,
  "daily_limit": 100
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "key_xyz789",
    "key": "bm_live_xxxxxxxxxxxxxxxx",
    "name": "Production",
    "keyPrefix": "bm_live_a1b2",
    "message": "Store this key securely. It will not be shown again."
  }
}
```

**Important:** The full API key is only shown ONCE at creation. Store it securely.

#### Revoke Key

**`DELETE /api/keys/[keyId]`**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

### 3. Usage Statistics

**`GET /api/usage`**

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `30d` | `7d`, `30d`, `90d` |
| `key_id` | string | all | Filter by specific API key ID |
| `page` | number | 1 | Page number (for request log view) |
| `limit` | number | 20 | Results per page (max 100) |
| `view` | string | `stats` | `stats` for aggregated, `log` for paginated request log |

**Response — Stats View (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_requests": 15420,
      "blocked": 3200,
      "allowed": 12220,
      "block_rate": 0.207,
      "avg_risk_score": 42.5
    },
    "daily": [
      {
        "date": "2026-06-10",
        "requests": 520,
        "blocked": 110,
        "allowed": 410
      }
    ],
    "by_key": [
      {
        "key_id": "key_abc123",
        "requests": 12000,
        "blocked": 2500
      }
    ],
    "by_reason": [
      {
        "reason": "domain_blocklist_hit",
        "count": 2100
      }
    ],
    "by_domain": [
      {
        "domain": "mailinator.com",
        "total": 500,
        "blocked": 498,
        "allowed": 2
      }
    ]
  }
}
```

**Response — Log View (200 OK):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "log_abc123",
        "email": "u***@mailinator.com",
        "domain": "mailinator.com",
        "isDisposable": true,
        "riskScore": 95,
        "reason": "domain_blocklist_hit",
        "apiKeyId": "key_abc123",
        "latencyMs": 45,
        "createdAt": "2026-06-10T12:00:00Z"
      }
    ],
    "total": 15420,
    "page": 1,
    "totalPages": 771
  }
}
```

---

### 4. Webhook Management

#### List Webhooks

**`GET /api/webhooks`**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://yourapp.com/webhooks/blockmail",
      "events": ["email.blocked"],
      "isActive": true,
      "failureCount": 0,
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

#### Create Webhook

**`POST /api/webhooks`**

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/blockmail",
  "events": ["email.blocked", "email.allowed"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "wh_xyz789",
    "url": "https://yourapp.com/webhooks/blockmail",
    "events": ["email.blocked", "email.allowed"],
    "secret": "whsec_xxxxxxxxxxxxxxxx",
    "isActive": true,
    "message": "Store the webhook secret securely. It will not be shown again."
  }
}
```

#### Toggle Webhook

**`PATCH /api/webhooks/[webhookId]`**

**Request Body:**
```json
{
  "isActive": false
}
```

#### Delete Webhook

**`DELETE /api/webhooks/[webhookId]`**

#### Webhook Payload

When an event occurs, we send a POST request to your URL:

```json
{
  "event": "email.blocked",
  "timestamp": "2026-06-10T12:00:00Z",
  "data": {
    "email": "user@mailinator.com",
    "is_disposable": true,
    "risk_score": 95,
    "reason": "domain_blocklist_hit",
    "request_id": "req_abc123"
  }
}
```

**Webhook Signature:**
```
X-Blockmail-Signature: sha256=xxxxxxxxxxxx
X-Blockmail-Timestamp: 1718035200
```

Verify the signature using your webhook secret with HMAC-SHA256.

**Supported Events:**
| Event | Description |
|-------|-------------|
| `email.blocked` | A disposable email was detected |
| `email.allowed` | A clean email was verified |
| `key.created` | A new API key was created |
| `key.revoked` | An API key was revoked |

---

### 5. Health Check

**`GET /api/health`**

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00Z",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 12
    },
    "engine": {
      "status": "connected",
      "latencyMs": 45
    }
  }
}
```

**Status Values:**
| Status | HTTP | Description |
|--------|------|-------------|
| `healthy` | 200 | All services connected |
| `degraded` | 503 | One or more services unavailable |

---

### 6. Billing

#### Create Checkout Session

**`POST /api/billing/checkout`**

Creates a Stripe Checkout session for upgrading to PRO.

**Response (200 OK):**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxx"
}
```

#### Create Portal Session

**`POST /api/billing/portal`**

Creates a Stripe Customer Portal session for managing subscription.

**Response (200 OK):**
```json
{
  "url": "https://billing.stripe.com/p/session/xxx"
}
```

#### Stripe Webhook

**`POST /api/webhooks/stripe`**

Handles Stripe events (subscription lifecycle). This is called by Stripe, not by your application.

---

## Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded."
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `MISSING_API_KEY` | 401 | No API key provided |
| `INVALID_API_KEY` | 401 | API key is invalid or doesn't exist |
| `KEY_REVOKED` | 401 | API key has been revoked |
| `RATE_LIMIT_EXCEEDED` | 429 | Per-minute rate limit exceeded |
| `DAILY_LIMIT_EXCEEDED` | 429 | Daily rate limit exceeded |
| `ENGINE_UNAVAILABLE` | 503 | Verification engine is not available |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Code Examples

### cURL

```bash
# Verify an email
curl -X POST https://api.blockmail.dev/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"email": "test@mailinator.com"}'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('https://api.blockmail.dev/api/v1/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key',
  },
  body: JSON.stringify({ email: 'test@mailinator.com' }),
});

const data = await response.json();

if (data.data.is_disposable) {
  console.log(`Blocked: ${data.data.analysis.reason}`);
}
```

### Python

```python
import requests

response = requests.post(
    'https://api.blockmail.dev/api/v1/verify',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'your_api_key',
    },
    json={'email': 'test@mailinator.com'},
)

data = response.json()
if data['data']['is_disposable']:
    print(f"Blocked: {data['data']['analysis']['reason']}")
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]string{
        "email": "test@mailinator.com",
    })

    req, _ := http.NewRequest("POST", "https://api.blockmail.dev/api/v1/verify", bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", "your_api_key")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    data := result["data"].(map[string]interface{})
    if data["is_disposable"].(bool) {
        fmt.Printf("Blocked: %s\n", data["analysis"].(map[string]interface{})["reason"])
    }
}
```

---

**This document is the source of truth for API design.**
