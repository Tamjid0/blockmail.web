# DATABASE SCHEMA

> **PostgreSQL schema for Blockmail SaaS**

---

## Overview

- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Naming:** snake_case for columns, camelCase in code
- **IDs:** CUID (globally unique, sortable)
- **Timestamps:** UTC, ISO 8601

---

## Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================

model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  name          String?
  plan          Plan      @default(FREE)
  apiKeys       ApiKey[]
  usageLogs     UsageLog[]
  webhooks      Webhook[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([clerkId])
  @@index([email])
}

// ============================================
// API KEYS
// ============================================

model ApiKey {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Unkey integration
  unkeyId       String    @unique  // Unkey's key ID
  
  // Display info
  name          String               // "Production", "Staging"
  keyPrefix     String               // "bm_live_a1b2" (shown in dashboard)
  
  // Configuration
  permissions   String[]  @default(["verify"])  // ["verify", "admin"]
  rateLimit     Int       @default(100)          // requests per minute
  dailyLimit    Int       @default(100)          // requests per day
  
  // Status
  isActive      Boolean   @default(true)
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  
  // Relations
  usageLogs     UsageLog[]
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([keyPrefix])
  @@index([unkeyId])
}

// ============================================
// USAGE LOGS
// ============================================

model UsageLog {
  id            String    @id @default(cuid())
  apiKeyId      String
  apiKey        ApiKey    @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  
  // Request info
  requestId     String    @unique  // Unique request ID for tracing
  email         String               // Raw email (encrypted at rest)
  emailHash     String               // SHA-256 for lookups
  domain        String               // Extracted domain
  
  // Result
  isDisposable  Boolean
  riskScore     Int                   // 0-100
  tierTriggered Int                   // 1-6 (0 = allowed)
  reason        String                // "domain_blocklist_hit", etc.
  
  // Performance
  latencyMs     Int                   // Response time in milliseconds
  
  // Context
  ipAddress     String?               // Client IP (if provided)
  userAgent     String?               // Client user agent (if provided)
  countryCode   String?               // ISO country code (if provided)
  
  // Timestamps
  createdAt     DateTime  @default(now())

  @@index([apiKeyId])
  @@index([createdAt])
  @@index([domain])
  @@index([isDisposable])
}

// ============================================
// WEBHOOKS
// ============================================

model Webhook {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Configuration
  url           String               // Webhook endpoint URL
  events        String[]             // ["email.blocked", "email.allowed"]
  secret        String               // HMAC signature secret (shown once)
  
  // Status
  isActive      Boolean   @default(true)
  lastTriggeredAt DateTime?
  failureCount  Int       @default(0)  // Consecutive failures
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([isActive])
}

// ============================================
// PLANS
// ============================================

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

// ============================================
// WEBHOOK EVENTS
// ============================================

// Webhook event types
// email.blocked - Fired when an email is blocked
// email.allowed - Fired when an email is allowed
// key.created   - Fired when an API key is created
// key.revoked   - Fired when an API key is revoked
```

---

## Relationships

```
User (1) ──→ (N) ApiKey
User (1) ──→ (N) Webhook
ApiKey (1) ──→ (N) UsageLog
```

---

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `User` | `clerkId` | Fast Clerk webhook lookups |
| `User` | `email` | Fast email searches |
| `ApiKey` | `userId` | Fast user key listing |
| `ApiKey` | `keyPrefix` | Fast key lookups |
| `ApiKey` | `unkeyId` | Fast Unkey integration |
| `UsageLog` | `apiKeyId` | Fast key usage queries |
| `UsageLog` | `createdAt` | Time-range queries |
| `UsageLog` | `domain` | Domain analytics |
| `UsageLog` | `isDisposable` | Filter blocked/allowed |
| `Webhook` | `userId` | Fast user webhook listing |
| `Webhook` | `isActive` | Fast active webhook queries |

---

## Data Retention

| Data | Retention | Reason |
|------|-----------|--------|
| Users | Forever | Account history |
| API Keys | Forever (soft deleted) | Audit trail |
| Usage Logs | 90 days | Storage optimization |
| Webhooks | Forever (soft deleted) | Configuration history |

---

## Backup Strategy

- **Daily backups** — Full database snapshot
- **Point-in-time recovery** — WAL archiving
- **Cross-region replication** — For disaster recovery
- **Test restores** — Monthly backup restoration tests

---

## Migrations

All schema changes go through Prisma migrations:

```bash
# Create migration
npx prisma migrate dev --name add_webhooks_table

# Apply to production
npx prisma migrate deploy

# Reset (development only)
npx prisma migrate reset
```

---

## Seeding

Development seed data:

```bash
npx prisma db seed
```

Seed includes:
- Test user (Clerk ID: `test_user_123`)
- Sample API keys
- Sample usage logs
- Default plans

---

**This document is the source of truth for database design.**
