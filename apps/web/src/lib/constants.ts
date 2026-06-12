// ============================================
// App Constants
// ============================================

export const APP_NAME = "Blockmail";
export const APP_DESCRIPTION =
  "Block disposable and temporary emails from your signup flows with our powerful 6-tier verification engine.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================
// API Constants
// ============================================

export const API_PREFIX = "/api/v1";
export const API_KEY_HEADER = "X-API-Key";
export const API_KEY_PREFIX = "bm_live_";
export const API_KEY_PREFIX_TEST = "bm_test_";
export const ZUPLO_KEY_PREFIX = "zpka_";

// ============================================
// Webhook Events
// ============================================

export const WEBHOOK_EVENTS = [
  "email.blocked",
  "email.allowed",
  "key.created",
  "key.revoked",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ============================================
// Plan Limits
// ============================================

export const PLAN_LIMITS = {
  FREE: {
    maxApiKeys: 2,
    maxWebhooks: 1,
    requestsPerDay: 100,
    requestsPerMinute: 10,
    priceLabel: "$0",
    priceDescription: "Free forever",
    stripePriceId: null as string | null,
  },
  PRO: {
    maxApiKeys: 10,
    maxWebhooks: 5,
    requestsPerDay: 10000,
    requestsPerMinute: 100,
    priceLabel: "$29/mo",
    priceDescription: "For growing teams",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  ENTERPRISE: {
    maxApiKeys: 50,
    maxWebhooks: 20,
    requestsPerDay: 100000,
    requestsPerMinute: 1000,
    priceLabel: "Custom",
    priceDescription: "For large scale",
    stripePriceId: null as string | null,
  },
} as const;

// ============================================
// Verification Reasons
// ============================================

export const VERIFICATION_REASONS = {
  allowed: "allowed",
  syntax_invalid: "syntax_invalid",
  domain_blocklist_hit: "domain_blocklist_hit",
  mx_blocklist_hit: "mx_blocklist_hit",
  domain_too_new: "domain_too_new",
  infra_fingerprint_hit: "infra_fingerprint_hit",
  behavioral_context_hit: "behavioral_context_hit",
  lookup_timeout_failsafe: "lookup_timeout_failsafe",
} as const;

// ============================================
// Risk Score Legend
// ============================================

export const RISK_SCORES = {
  0: "Clean - fully allowed",
  70: "Suspicious - domain registered < 30 days ago",
  80: "Likely disposable - MX server is on blocklist",
  85: "Suspicious infrastructure - datacenter hosting with high density",
  90: "Suspicious activity - datacenter client IP with high velocity",
  95: "Disposable - domain is on blocklist",
  100: "Invalid - email syntax is malformed",
} as const;
