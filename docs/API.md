# API REFERENCE

> **Blockmail SaaS API — Complete Specification**

---

## Base URL

```
Production:  https://api.blockmail.dev
Staging:     https://staging-api.blockmail.dev
Local:       http://localhost:3000
```

---

## Authentication

### Dashboard API (Clerk)
All `/api/keys/*`, `/api/usage/*`, `/api/webhooks/*` routes require a valid Clerk session cookie. These are browser-only routes.

### Public API (Unkey)
All `/api/v1/*` routes require an API key in the `X-API-Key` header.

```
X-API-Key: bm_live_xxxxxxxxxxxxxxxx
```

### Key Format
```
Prefix:  bm_live_ (production) or bm_test_ (sandbox)
Length:  32 bytes random (total key: ~40 chars)
Example: bm_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Rate Limits

| Tier | Requests/Day | Requests/Minute |
|------|--------------|-----------------|
| Free | 100 | 10 |
| Pro | 1,000 | 100 |
| Enterprise | Custom | Custom |

### Headers
Every response includes rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1718035200
```

---

## Endpoints

### 1. Verify Single Email

**`POST /api/v1/verify`**

Verify if a single email address is disposable.

**Headers:**
```
Content-Type: application/json
X-API-Key: bm_live_xxxxx
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
| `email` | string | Yes | Email to verify |
| `context.ip_address` | string | No | Client IP for behavioral analysis |
| `context.user_agent` | string | No | Client user agent |
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
      "domain": "mailinator.com",
      "mx_records": ["mx.mailinator.com"],
      "domain_age_days": null,
      "asn_number": null,
      "asn_org": "",
      "subnet_density": 0,
      "ns_reputation": 0,
      "mx_subnets": [],
      "ns_servers": []
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "latency_ms": 12
  }
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid email format |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 503 | `ENGINE_UNAVAILABLE` | Verification service unavailable |

**Example (cURL):**
```bash
curl -X POST https://api.blockmail.dev/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bm_live_xxxxx" \
  -d '{"email": "test@mailinator.com"}'
```

---

### 2. Check Multiple Emails

**`POST /api/v1/check`**

Verify multiple emails in a single request (max 100).

**Headers:**
```
Content-Type: application/json
X-API-Key: bm_live_xxxxx
```

**Request Body:**
```json
{
  "emails": [
    "user1@example.com",
    "user2@mailinator.com",
    "user3@gmail.com"
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emails` | string[] | Yes | Array of emails (max 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "email": "user1@example.com",
        "is_disposable": false,
        "risk_score": 0
      },
      {
        "email": "user2@mailinator.com",
        "is_disposable": true,
        "risk_score": 95
      },
      {
        "email": "user3@gmail.com",
        "is_disposable": false,
        "risk_score": 0
      }
    ],
    "summary": {
      "total": 3,
      "disposable": 1,
      "clean": 2
    }
  },
  "meta": {
    "request_id": "req_def456",
    "latency_ms": 45
  }
}
```

---

### 3. API Key Management

All key management endpoints require Clerk authentication (browser session).

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
      "prefix": "bm_live_a1b2",
      "permissions": ["verify"],
      "rate_limit": 1000,
      "is_active": true,
      "last_used_at": "2026-06-10T12:00:00Z",
      "created_at": "2026-06-01T00:00:00Z"
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
  "rate_limit": 1000
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
    "prefix": "bm_live_a1b2",
    "message": "Store this key securely. It will not be shown again."
  }
}
```

**⚠️ Important:** The full API key is only shown ONCE at creation. Store it securely.

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

### 4. Usage Statistics

**`GET /api/usage`**

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `30d` | `7d`, `30d`, `90d` |
| `key_id` | string | all | Filter by specific key |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_requests": 15420,
      "blocked": 3200,
      "allowed": 12220,
      "block_rate": 0.207
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
        "key_name": "Production",
        "requests": 12000,
        "blocked": 2500
      }
    ],
    "by_reason": [
      {
        "reason": "domain_blocklist_hit",
        "count": 2100
      },
      {
        "reason": "infra_fingerprint_hit",
        "count": 800
      }
    ]
  }
}
```

---

### 5. Webhook Management

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
      "is_active": true,
      "created_at": "2026-06-01T00:00:00Z"
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
    "is_active": true,
    "message": "Store the webhook secret securely. It will not be shown again."
  }
}
```

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
    "reason": "domain_blocklist_hit"
  }
}
```

**Webhook Signature:**
```
X-Blockmail-Signature: sha256=xxxxxxxxxxxx
X-Blockmail-Timestamp: 1718035200
```

Verify the signature using your webhook secret.

---

### 6. Health Check

**`GET /api/health`**

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "engine": "connected",
    "unkey": "connected"
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please upgrade your plan."
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

---

## SDKs

### JavaScript/TypeScript
```bash
npm install @blockmail/sdk
```

```typescript
import { Blockmail } from '@blockmail/sdk';

const blockmail = new Blockmail('bm_live_xxxxx');

const result = await blockmail.verify('user@example.com');
if (result.is_disposable) {
  // Block the signup
}
```

### Python
```bash
pip install blockmail
```

```python
from blockmail import Blockmail

client = Blockmail(api_key="bm_live_xxxxx")
result = client.verify("user@example.com")

if result.is_disposable:
    # Block the signup
    pass
```

### Go
```bash
go get github.com/blockmail/blockmail-go
```

```go
import blockmail "github.com/blockmail/blockmail-go"

client := blockmail.New("bm_live_xxxxx")
result, _ := client.Verify("user@example.com", nil)

if result.IsDisposable {
    // Block the signup
}
```

---

**This document is the source of truth for API design.**
